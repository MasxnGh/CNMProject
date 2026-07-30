import { getLevelById } from "../data/levels.js";

/**
 * Samples a question pool across several nodes, interleaved so the test
 * moves between nodes instead of marching through one, and spread across
 * mission types within each node before repeating. Shared by the unlock-test
 * (Phase 4) - normal single-node lessons don't need sampling since they
 * already play every question in their own node directly.
 */
const spreadByType = (questions, perNode) => {
  const byType = new Map();
  questions.forEach((question) => {
    if (!byType.has(question.type)) byType.set(question.type, []);
    byType.get(question.type).push(question);
  });
  // one of each type first, so a node contributes variety before repeats
  const spread = [...byType.values()].flatMap((group) => group.slice(0, 1));
  const rest = questions.filter((question) => !spread.includes(question));
  return [...spread, ...rest].slice(0, perNode);
};

export const buildQuestionPool = (nodeIds, { perNode = 5, max = 15 } = {}) => {
  const perNodeQuestions = nodeIds.map((nodeId) => {
    const level = getLevelById(nodeId);
    return level ? spreadByType(level.questions, perNode) : [];
  });

  const questions = [];
  for (let round = 0; round < perNode; round += 1) {
    perNodeQuestions.forEach((group) => {
      if (group[round]) questions.push(group[round]);
    });
  }
  return questions.slice(0, max);
};
