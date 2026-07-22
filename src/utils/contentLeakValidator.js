const DISPLAY_FIELDS = ["title", "instruction", "question", "chineseText", "pinyin", "thaiMeaning", "hint"];

const isPresent = (value) => typeof value === "string" && value.trim().length > 0;

const addIssue = (issues, code, message, field) => {
  issues.push({ code, message, ...(field ? { field } : {}) });
};

const valuesFrom = (value, field = "beforeAnswer") => {
  if (typeof value === "string") return [{ value, field }];
  if (Array.isArray(value)) return value.flatMap((item, index) => valuesFrom(item, `${field}[${index}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => valuesFrom(item, `${field}.${key}`));
  }
  return [];
};

const legacyDisplayValues = (mission, fields = DISPLAY_FIELDS) =>
  fields.filter((field) => isPresent(mission[field])).map((field) => ({ value: mission[field], field }));

const hasOwn = (value, field) => value && typeof value === "object" && Object.hasOwn(value, field);

const beforeAnswerValues = (mission, legacyFields) => {
  if (!mission.beforeAnswer || typeof mission.beforeAnswer !== "object") {
    return legacyDisplayValues(mission, legacyFields);
  }

  const legacyFallbacks = legacyFields
    .filter((field) => !hasOwn(mission.beforeAnswer, field) && isPresent(mission[field]))
    .map((field) => ({ value: mission[field], field }));
  return [...valuesFrom(mission.beforeAnswer), ...legacyFallbacks];
};

const nestedFirst = (mission, container, field) => {
  const nested = mission[container];
  if (hasOwn(nested, field)) return { value: nested[field], field: `${container}.${field}` };
  return { value: mission[field], field };
};

const answerField = (mission, field) => nestedFirst(mission, "answer", field);
const beforeField = (mission, field) => nestedFirst(mission, "beforeAnswer", field);

const isSelectableField = (field) =>
  /^beforeAnswer\.(?:options|leftCards|rightCards|items)(?:\[|\.|$)/.test(field);

const promptValues = (values) => values.filter(({ field }) => !isSelectableField(field));

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const containsAnswer = (text, answer) => {
  if (typeof answer !== "string") return false;

  const trimmed = answer.trim();
  if (!trimmed) return false;
  if (/\p{Script=Han}/u.test(trimmed)) return text.includes(trimmed);
  if (trimmed.length < 2) return false;
  if (/^[a-z0-9]+$/i.test(trimmed)) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(trimmed)}($|[^a-z0-9])`, "i").test(text);
  }
  return text.includes(trimmed);
};

const pinyinFinalIsVisible = (value, field, answer) => {
  if (containsAnswer(value, answer)) return true;
  if (typeof answer !== "string" || answer.trim().length !== 1) return false;

  const finalLabel = new RegExp(
    `(?:\\bpinyin\\s+)?(?:final|vowel|sound)\\s*(?:is\\s*)?[:=-]?\\s*${escapeRegExp(answer.trim())}(?=$|[^\\p{L}\\p{N}])`,
    "iu",
  );
  const thaiFinalLabel = new RegExp(
    `\\u0e40\\u0e1b\\u0e47\\u0e19\\s*${escapeRegExp(answer.trim())}(?=$|[^\\p{L}\\p{N}])`,
    "u",
  );
  return /(?:pinyinFinal|final)$/i.test(field) || finalLabel.test(value) || thaiFinalLabel.test(value);
};

const normalizeSentence = (value) => value.replace(/[\s\p{P}]/gu, "");

const answerText = (mission) => {
  const { value } = answerField(mission, "correctAnswer");
  return typeof value === "string" ? value : "";
};

const findVisibleAnswer = (values, answer) => values.find(({ value }) => containsAnswer(value, answer));

const afterAnswerContent = (mission) => {
  if (mission.afterAnswer && typeof mission.afterAnswer === "object") return mission.afterAnswer;
  return {
    explanation: mission.explanation,
    pinyin: mission.pinyin,
    translation: mission.translation ?? mission.thaiMeaning,
  };
};

const validateAfterAnswer = (mission, errors) => {
  const afterAnswer = afterAnswerContent(mission);
  const requirements = [
    ["explanation", "AFTER_ANSWER_EXPLANATION_MISSING", "Mission needs an after-answer explanation."],
    ["pinyin", "AFTER_ANSWER_PINYIN_MISSING", "Mission needs after-answer pinyin."],
    ["translation", "AFTER_ANSWER_TRANSLATION_MISSING", "Mission needs an after-answer translation."],
  ];

  requirements.forEach(([field, code, message]) => {
    if (!isPresent(afterAnswer[field])) addIssue(errors, code, message, `afterAnswer.${field}`);
  });
};

const validateOptions = (mission, errors) => {
  const { value: options, field: optionsField } = beforeField(mission, "options");
  if (!Array.isArray(options)) return;

  const normalizedOptions = options.map((option) => String(option).trim().toLocaleLowerCase());
  if (new Set(normalizedOptions).size !== normalizedOptions.length) {
    addIssue(errors, "DUPLICATE_OPTIONS", "Mission options must be unique.", optionsField);
  }

  const { value: correctAnswer, field: answerPath } = answerField(mission, "correctAnswer");
  if (typeof correctAnswer === "string") {
    const normalizedAnswer = correctAnswer.trim().toLocaleLowerCase();
    if (!normalizedOptions.includes(normalizedAnswer)) {
      addIssue(errors, "CORRECT_ANSWER_NOT_IN_OPTIONS", "Scalar correctAnswer must be included in options.", answerPath);
    }
  }
};

const validateHint = (mission, errors) => {
  const { value: hint, field: hintField } = beforeField(mission, "hint");
  if (!isPresent(hint)) return;

  const directAnswerPhrase = /(?:answer\s*(?:is|:)|\u0e04\u0e33\u0e15\u0e2d\u0e1a\u0e04\u0e37\u0e2d)/i;
  const { value: pairs } = answerField(mission, "pairs");
  const exposesPair = Array.isArray(pairs)
    && pairs.some((pair) =>
      isPresent(pair.left) && isPresent(pair.right) && hint.includes(pair.left) && hint.includes(pair.right) && /[=:]/.test(hint),
    );

  if (directAnswerPhrase.test(hint) || exposesPair) {
    addIssue(errors, "DIRECT_HINT_ANSWER", "Hint directly reveals the answer.", hintField);
  }
};

const validateByType = (mission, errors) => {
  const answer = answerText(mission);
  const type = mission.type;

  if (type === "pinyinDrag") {
    const values = promptValues(beforeAnswerValues(mission, ["title", "instruction", "question", "hint", "pinyinPattern", "prefix", "suffix"]));
    const visible = values.find(({ field, value }) => pinyinFinalIsVisible(value, field, answer));
    if (visible) addIssue(errors, "PINYIN_FINAL_VISIBLE", "Pinyin final is visible before the answer.", visible.field);
  }

  if (type === "toneChoice") {
    const visible = findVisibleAnswer(promptValues(beforeAnswerValues(mission, ["title", "instruction", "question", "pinyin", "hint"])), answer);
    if (visible) addIssue(errors, "TONE_ANSWER_PINYIN_VISIBLE", "Answer pinyin is visible before the tone choice.", visible.field);
  }

  if (type === "audioChoice") {
    const values = promptValues(mission.beforeAnswer
      ? valuesFrom(mission.beforeAnswer)
      : legacyDisplayValues(mission, ["transcript"]));
    const visible = findVisibleAnswer(values, answer);
    if (visible) addIssue(errors, "AUDIO_TRANSCRIPT_VISIBLE", "Audio transcript or target is visible before the answer.", visible.field);
  }

  if (type === "sentenceOrder") {
    const { value: correctSequence } = answerField(mission, "correctSequence");
    const { value: correctAnswer } = answerField(mission, "correctAnswer");
    const sequence = Array.isArray(correctSequence)
      ? correctSequence.join("")
      : Array.isArray(correctAnswer)
        ? correctAnswer.join("")
        : "";
    const visible = sequence && promptValues(beforeAnswerValues(mission, ["title", "instruction", "question", "chineseText", "pinyin", "hint"]))
      .find(({ value }) => normalizeSentence(value).includes(normalizeSentence(sequence)));
    if (visible) addIssue(errors, "SENTENCE_SEQUENCE_VISIBLE", "Completed sentence sequence is visible before ordering.", visible.field);
  }

  if (type === "fillBlank") {
    const values = promptValues(beforeAnswerValues(mission, ["title", "instruction", "question", "chineseText", "pinyin", "hint"]));
    const answerVisible = findVisibleAnswer(values.filter(({ field }) => !field.endsWith(".pinyin") && field !== "pinyin"), answer);
    const pinyinVisible = values.find(({ field, value }) => (field.endsWith(".pinyin") || field === "pinyin") && isPresent(value));
    if (answerVisible) addIssue(errors, "FILL_BLANK_ANSWER_VISIBLE", "Fill-blank answer is visible before submission.", answerVisible.field);
    if (pinyinVisible) addIssue(errors, "FILL_BLANK_PINYIN_VISIBLE", "Full pinyin is visible before the blank is answered.", pinyinVisible.field);
  }

  if (type === "matching" && mission.beforeAnswer) {
    const cards = Array.isArray(mission.beforeAnswer.cards) ? mission.beforeAnswer.cards : [];
    const exposesPair = cards.some((card) => isPresent(card.chinese) && isPresent(card.thai));
    if (exposesPair) addIssue(errors, "MATCHING_PAIR_VISIBLE", "A matching card exposes Chinese and Thai together.", "beforeAnswer.cards");
  }
};

export const validateMission = (mission, context = {}) => {
  const errors = [];
  const warnings = [];
  const safeMission = mission && typeof mission === "object" ? mission : {};

  validateAfterAnswer(safeMission, errors);
  validateOptions(safeMission, errors);
  validateHint(safeMission, errors);
  validateByType(safeMission, errors);

  return {
    missionId: safeMission.id ?? context.missionId ?? "unknown",
    levelId: safeMission.levelId ?? context.levelId ?? "unknown",
    errors,
    warnings,
  };
};

export const validateLevels = (levels) => {
  const entries = Array.isArray(levels) ? levels : [];
  const missions = entries.flatMap((level) => {
    const levelMissions = Array.isArray(level?.missions) ? level.missions : Array.isArray(level?.questions) ? level.questions : [];
    return levelMissions.map((mission) => validateMission(mission, { levelId: level?.id }));
  });

  return {
    total: missions.length,
    passed: missions.filter((mission) => mission.errors.length === 0).length,
    warnings: missions.reduce((total, mission) => total + mission.warnings.length, 0),
    errors: missions.reduce((total, mission) => total + mission.errors.length, 0),
    missions,
  };
};
