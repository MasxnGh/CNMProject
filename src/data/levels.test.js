import { describe, expect, test } from "vitest";
import { validateLevels } from "../utils/contentLeakValidator.js";
import { levels } from "./levels.js";

const missions = levels.flatMap((level) => level.questions);
const missionById = (id) => missions.find((item) => item.id === id);

const expectedMissionIdTypes = {
  1: ["1-1:matching", "1-2:shopping", "1-3:audioChoice", "1-4:fillBlank", "1-5:imageChoice"],
  2: ["2-1:pinyinDrag", "2-2:toneChoice", "2-3:audioChoice", "2-4:pinyinDrag", "2-5:toneChoice"],
  3: ["3-1:sentenceOrder", "3-2:dialogue", "3-3:sentenceOrder", "3-4:fillBlank", "3-5:audioChoice"],
  4: ["4-1:multipleChoice", "4-2:toneChoice", "4-3:fillBlank", "4-4:sentenceOrder", "4-5:audioChoice"],
  5: ["5-1:multipleChoice", "5-2:audioChoice", "5-3:matching", "5-4:fillBlank", "5-5:shopping"],
  6: ["6-1:shopping", "6-2:dialogue", "6-3:fillBlank", "6-4:audioChoice", "6-5:matching"],
  7: ["7-1:cultureQuiz", "7-2:imageChoice", "7-3:matching", "7-4:audioChoice", "7-5:shopping"],
  8: ["8-1:matching", "8-2:fillBlank", "8-3:shopping", "8-4:audioChoice", "8-5:pinyinDrag"],
  9: ["9-1:pinyinDrag", "9-2:audioChoice", "9-3:matching", "9-4:toneChoice", "9-5:shopping"],
  10: ["10-1:fillBlank", "10-2:sentenceOrder", "10-3:matching", "10-4:audioChoice", "10-5:toneChoice"],
  11: ["11-1:shopping", "11-2:matching", "11-3:fillBlank", "11-4:audioChoice", "11-5:pinyinDrag"],
  12: ["12-1:hanziTrace", "12-2:hanziTrace", "12-3:matching", "12-4:toneChoice", "12-5:audioChoice"],
  13: ["13-1:sentenceOrder", "13-2:fillBlank", "13-3:sentenceOrder", "13-4:fillBlank", "13-5:audioChoice"],
  14: ["14-1:pinyinDrag", "14-2:toneChoice", "14-3:cultureQuiz", "14-4:sentenceOrder", "14-5:matching"],
  15: ["15-1:finalBoss", "15-2:pinyinDrag", "15-3:audioChoice", "15-4:hanziTrace", "15-5:sentenceOrder"],
};

const expectedKnowledgeCore = {
  1: [
    "1-k-1 | 水 | shuǐ | น้ำ",
    "1-k-2 | 茶 | chá | ชา",
    "1-k-3 | 米饭 | mǐfàn | ข้าวสวย",
    "1-k-4 | 面条 | miàntiáo | บะหมี่",
    "1-k-5 | 饺子 | jiǎozi | เกี๊ยว",
  ],
  2: [
    "2-k-1 | 你好 | nǐ hǎo | สวัสดี",
    "2-k-2 | 谢谢 | xièxie | ขอบคุณ",
    "2-k-3 | 再见 | zàijiàn | ลาก่อน",
    "2-k-4 | 老师 | lǎoshī | ครู",
    "2-k-5 | 学生 | xuéshēng | นักเรียน",
  ],
  3: [
    "3-k-1 | 你好！ | Nǐ hǎo! | สวัสดี",
    "3-k-2 | 你叫什么名字？ | Nǐ jiào shénme míngzi? | คุณชื่ออะไร",
    "3-k-3 | 我叫小明。 | Wǒ jiào Xiǎomíng. | ฉันชื่อเสี่ยวหมิง",
    "3-k-4 | 很高兴认识你。 | Hěn gāoxìng rènshi nǐ. | ยินดีที่ได้รู้จัก",
    "3-k-5 | 再见！ | Zàijiàn! | ลาก่อน",
  ],
  4: [
    "4-k-1 | 一 | yī | หนึ่ง",
    "4-k-2 | 二 | èr | สอง",
    "4-k-3 | 三 | sān | สาม",
    "4-k-4 | 十 | shí | สิบ",
    "4-k-5 | 今天 | jīntiān | วันนี้",
    "4-k-6 | 明天 | míngtiān | พรุ่งนี้",
  ],
  5: [
    "5-k-1 | 火车 | huǒchē | รถไฟ",
    "5-k-2 | 飞机 | fēijī | เครื่องบิน",
    "5-k-3 | 车站 | chēzhàn | สถานี",
    "5-k-4 | 票 | piào | ตั๋ว",
    "5-k-5 | 我要去北京。 | Wǒ yào qù Běijīng. | ฉันต้องการไปปักกิ่ง",
  ],
  6: [
    "6-k-1 | 菜单 | càidān | เมนู",
    "6-k-2 | 好吃 | hǎochī | อร่อย",
    "6-k-3 | 多少钱？ | Duōshǎo qián? | ราคาเท่าไหร่",
    "6-k-4 | 我要这个。 | Wǒ yào zhège. | ฉันเอาอันนี้",
    "6-k-5 | 米饭 | mǐfàn | ข้าว",
  ],
  7: [
    "7-k-1 | 春节 | Chūnjié | ตรุษจีน",
    "7-k-2 | 红包 | hóngbāo | อั่งเปา",
    "7-k-3 | 灯笼 | dēnglóng | โคมไฟ",
    "7-k-4 | 舞龙 | wǔlóng | เชิดมังกร",
    "7-k-5 | 新年快乐 | xīnnián kuàilè | สวัสดีปีใหม่",
  ],
  8: [
    "8-k-1 | 书 | shū | หนังสือ",
    "8-k-2 | 笔 | bǐ | ปากกา",
    "8-k-3 | 桌子 | zhuōzi | โต๊ะ",
    "8-k-4 | 椅子 | yǐzi | เก้าอี้",
    "8-k-5 | 教室 | jiàoshì | ห้องเรียน",
  ],
  9: [
    "9-k-1 | 熊猫 | xióngmāo | แพนด้า",
    "9-k-2 | 狗 | gǒu | สุนัข",
    "9-k-3 | 猫 | māo | แมว",
    "9-k-4 | 鸟 | niǎo | นก",
    "9-k-5 | 鱼 | yú | ปลา",
  ],
  10: [
    "10-k-1 | 爸爸 | bàba | พ่อ",
    "10-k-2 | 妈妈 | māma | แม่",
    "10-k-3 | 哥哥 | gēge | พี่ชาย",
    "10-k-4 | 姐姐 | jiějie | พี่สาว",
    "10-k-5 | 家 | jiā | บ้าน / ครอบครัว",
  ],
  11: [
    "11-k-1 | 苹果 | píngguǒ | แอปเปิล",
    "11-k-2 | 香蕉 | xiāngjiāo | กล้วย",
    "11-k-3 | 红色 | hóngsè | สีแดง",
    "11-k-4 | 黄色 | huángsè | สีเหลือง",
    "11-k-5 | 绿色 | lǜsè | สีเขียว",
  ],
  12: [
    "12-k-1 | 人 | rén | คน",
    "12-k-2 | 口 | kǒu | ปาก",
    "12-k-3 | 山 | shān | ภูเขา",
    "12-k-4 | 日 | rì | พระอาทิตย์",
    "12-k-5 | 月 | yuè | ดวงจันทร์",
  ],
  13: [
    "13-k-1 | 我是学生。 | Wǒ shì xuéshēng. | ฉันเป็นนักเรียน",
    "13-k-2 | 我喜欢中国菜。 | Wǒ xǐhuān Zhōngguó cài. | ฉันชอบอาหารจีน",
    "13-k-3 | 他去学校。 | Tā qù xuéxiào. | เขาไปโรงเรียน",
    "13-k-4 | 这是我的书。 | Zhè shì wǒ de shū. | นี่คือหนังสือของฉัน",
    "13-k-5 | 你好吗？ | Nǐ hǎo ma? | คุณสบายดีไหม",
  ],
  14: [
    "14-k-1 | 猫 | māo | แมว",
    "14-k-2 | 马 | mǎ | ม้า",
    "14-k-3 | 春节 | Chūnjié | ตรุษจีน",
    "14-k-4 | 这是我的书。 | Zhè shì wǒ de shū. | นี่คือหนังสือของฉัน",
    "14-k-5 | 熊猫 | xióngmāo | แพนด้า",
  ],
  15: [
    "15-k-1 | 新年快乐 | xīnnián kuàilè | สวัสดีปีใหม่",
    "15-k-2 | 绿色 | lǜsè | สีเขียว",
    "15-k-3 | 我要去北京。 | Wǒ yào qù Běijīng. | ฉันต้องการไปปักกิ่ง",
    "15-k-4 | 中 | zhōng | กลาง / จีน",
    "15-k-5 | 我喜欢中国菜。 | Wǒ xǐhuān Zhōngguó cài. | ฉันชอบอาหารจีน",
  ],
};

const expectUnique = (values) => {
  expect(new Set(values).size).toBe(values.length);
};

const collectKeys = (value) => {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  return Object.entries(value).flatMap(([key, item]) => [key, ...collectKeys(item)]);
};

describe("mission data contract", () => {
  test("preserves the 15 levels and 75 missions topology", () => {
    expect(levels).toHaveLength(15);
    expect(missions).toHaveLength(75);

    levels.forEach((level) => {
      expect(level.questions).toHaveLength(5);
      level.questions.forEach((mission) => expect(mission.levelId).toBe(level.id));
    });
  });

  test("stores every mission in the nested before, answer, and after contract", () => {
    const legacyTopLevelFields = [
      "title",
      "instruction",
      "question",
      "chineseText",
      "pinyin",
      "thaiMeaning",
      "options",
      "correctAnswer",
      "correctSequence",
      "finalPinyin",
      "transcript",
      "explanation",
      "items",
      "pairs",
    ];
    const forbiddenBeforeKeys = ["correctAnswer", "correctSequence", "finalPinyin", "transcript", "explanation"];

    missions.forEach((mission) => {
      expect(mission.beforeAnswer).toBeTruthy();
      expect(mission.answer).toBeTruthy();
      expect(mission.afterAnswer).toBeTruthy();
      legacyTopLevelFields.forEach((field) => expect(mission).not.toHaveProperty(field));

      const beforeKeys = collectKeys(mission.beforeAnswer);
      forbiddenBeforeKeys.forEach((field) => expect(beforeKeys).not.toContain(field));
    });
  });

  test("provides complete Chinese, pinyin, Thai, and explanation reveal content", () => {
    missions.forEach((mission) => {
      expect(mission.afterAnswer.chineseText).toBeTruthy();
      expect(mission.afterAnswer.pinyin).toBeTruthy();
      expect(mission.afterAnswer.thaiMeaning).toBeTruthy();
      expect(mission.afterAnswer.translation).toBe(mission.afterAnswer.thaiMeaning);
      expect(mission.afterAnswer.explanation).toBeTruthy();
    });
  });

  test("keeps level, mission, knowledge, and selectable option identifiers unique", () => {
    expectUnique(levels.map((level) => level.id));
    expectUnique(missions.map((mission) => mission.id));
    expectUnique(levels.flatMap((level) => level.knowledge.map((item) => item.id)));

    missions.forEach((mission) => {
      const groups = [
        mission.beforeAnswer.options,
        mission.beforeAnswer.leftCards,
        mission.beforeAnswer.rightCards,
        mission.beforeAnswer.items?.map((item) => item.id ?? item.label),
      ].filter(Array.isArray);

      groups.forEach((group) => expectUnique(group.map((item) => JSON.stringify(item).toLocaleLowerCase())));
    });
  });

  test("preserves the stable mission IDs and types for every level", () => {
    const actual = Object.fromEntries(
      levels.map((level) => [level.id, level.questions.map((mission) => `${mission.id}:${mission.type}`)]),
    );

    expect(actual).toEqual(expectedMissionIdTypes);
  });

  test("preserves an independent baseline of knowledge IDs and core content", () => {
    const actual = Object.fromEntries(
      levels.map((level) => [
        level.id,
        level.knowledge.map(({ id, hanzi, pinyin, thai }) => `${id} | ${hanzi} | ${pinyin} | ${thai}`),
      ]),
    );

    expect(actual).toEqual(expectedKnowledgeCore);
  });

  test("preserves level rewards, mission rewards, knowledge, and badge unlocks", () => {
    const expectedBadges = {
      1: ["rookie-adventurer"],
      2: [],
      3: [],
      4: [],
      5: ["first-five"],
      6: [],
      7: ["culture-learner"],
      8: ["school-sage"],
      9: [],
      10: [],
      11: [],
      12: [],
      13: ["grammar-keeper"],
      14: ["wall-runner"],
      15: ["dujeen-master"],
    };

    expect(levels.flatMap((level) => level.knowledge)).toHaveLength(76);
    levels.forEach((level) => {
      expect(level.reward).toEqual({ xp: 100, coins: 50, stars: 3 });
      expect(level.badgeUnlock).toEqual(expectedBadges[level.id]);
      expect(level.knowledge).toEqual(
        level.terms.map((item, index) => ({ id: `${level.id}-k-${index + 1}`, ...item })),
      );
      level.questions.forEach((mission) => expect(mission.reward).toEqual({ score: 20 }));
    });
  });

  test("passes the content leak validator without errors", () => {
    expect(validateLevels(levels)).toMatchObject({ total: 75, passed: 75, warnings: 0, errors: 0 });
  });
});

describe("leak-safe mission type data", () => {
  test("keeps reviewed reveal triples internally consistent", () => {
    const revealTriple = (id) => {
      const { chineseText, pinyin, thaiMeaning } = missionById(id).afterAnswer;
      return { chineseText, pinyin, thaiMeaning };
    };

    expect(revealTriple("2-1")).toEqual({ chineseText: "你好", pinyin: "nǐ hǎo", thaiMeaning: "สวัสดี" });
    expect(revealTriple("2-2")).toEqual({ chineseText: "老", pinyin: "lǎo", thaiMeaning: "แก่ / อาวุโส" });
    expect(revealTriple("10-5")).toEqual({ chineseText: "妈", pinyin: "mā", thaiMeaning: "แม่" });
  });

  test("keeps the 9-1 pinyin final out of its prompt and hint", () => {
    const mission = missionById("9-1");

    expect(mission.beforeAnswer).toMatchObject({
      chineseText: "猫",
      thaiMeaning: "แมว",
      pinyinPattern: "m _ o",
      options: ["a", "e", "i", "u"],
    });
    expect(mission.answer).toMatchObject({ correctAnswer: "a", finalPinyin: "māo" });
    expect(JSON.stringify({ beforeAnswer: mission.beforeAnswer, hint: mission.hint })).not.toContain("māo");
    expect(mission.hint).not.toMatch(/(?:เสียงกลาง|final)\s*(?:เป็น|คือ)?\s*a/i);
  });

  test("keeps tone pinyin in choices and after-answer content only", () => {
    missions.filter((mission) => mission.type === "toneChoice").forEach((mission) => {
      expect(mission.beforeAnswer).not.toHaveProperty("pinyin");
      expect(mission.beforeAnswer.options).toContain(mission.answer.correctAnswer);
      expect(mission.afterAnswer.pinyin).toBe(mission.answer.correctAnswer);
    });
  });

  test("keeps audio targets out of before-answer data", () => {
    missions.filter((mission) => mission.type === "audioChoice").forEach((mission) => {
      const { options, ...prompt } = mission.beforeAnswer;
      expect(JSON.stringify(prompt)).not.toContain(mission.answer.correctAnswer);
      expect(mission.beforeAnswer.options).toContain(mission.answer.correctAnswer);
      expect(mission.beforeAnswer).not.toHaveProperty("chineseText");
      expect(mission.beforeAnswer).not.toHaveProperty("pinyin");
      expect(mission.beforeAnswer).not.toHaveProperty("thaiMeaning");
    });
  });

  test("keeps complete sentence and fill-blank pinyin in after-answer data", () => {
    missions.filter((mission) => mission.type === "sentenceOrder").forEach((mission) => {
      expect(mission.beforeAnswer).not.toHaveProperty("chineseText");
      expect(mission.beforeAnswer).not.toHaveProperty("pinyin");
      expect(mission.answer.correctSequence).toEqual(expect.any(Array));
    });

    missions.filter((mission) => mission.type === "fillBlank").forEach((mission) => {
      expect(mission.beforeAnswer.chineseText).toMatch(/_{3,}/);
      expect(mission.beforeAnswer).not.toHaveProperty("pinyin");
    });
  });

  test("stores matching sides separately and shopping choices as visual items", () => {
    missions.filter((mission) => mission.type === "matching").forEach((mission) => {
      expect(mission.beforeAnswer.leftCards).toEqual(expect.any(Array));
      expect(mission.beforeAnswer.rightCards).toEqual(expect.any(Array));
      expect(mission.beforeAnswer).not.toHaveProperty("cards");
      expect(mission.mechanics).toMatchObject({ shuffleSidesIndependently: true });
    });

    missions.filter((mission) => mission.type === "shopping").forEach((mission) => {
      expect(mission.beforeAnswer).not.toHaveProperty("targetList");
      mission.beforeAnswer.items.forEach((item) => {
        expect(Object.keys(item).sort()).toEqual(["emoji", "id", "label"]);
        expect(item.label).not.toBe(item.id);
      });
    });
  });

  test("marks Hanzi tracing as practice or challenge", () => {
    expect(missionById("12-1").mechanics.mode).toBe("practice");
    expect(missionById("12-2").mechanics.mode).toBe("practice");
    expect(missionById("15-4").mechanics.mode).toBe("challenge");
  });

  test("only offers a prompt reading where it cannot give the answer away", () => {
    missions.forEach((mission) => {
      const reading = mission.beforeAnswer.promptPinyin;
      if (!reading) return;

      // a reading is only ever attached to Chinese prompt text
      expect(mission.beforeAnswer.chineseText).toMatch(/[㐀-鿿]/);
      // and never where the reading is the thing being asked for
      expect(["toneChoice", "fillBlank", "pinyinDrag"]).not.toContain(mission.type);
      // nor where it would spell out one of the options
      const answer = mission.answer.correctAnswer;
      if (typeof answer === "string") {
        expect(reading).not.toBe(answer);
      }
    });
  });

  test("does not expose the final boss greeting pinyin before answer", () => {
    const mission = missionById("15-1");
    expect(JSON.stringify({ beforeAnswer: mission.beforeAnswer, hint: mission.hint })).not.toContain("xīnnián kuàilè");
    expect(mission.afterAnswer.pinyin).toBe("xīnnián kuàilè");
  });
});
