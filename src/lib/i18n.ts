export type Lang = "fr" | "en" | "zh";

interface Pack {
  selfDefPrompt: string;
  selfDefPlaceholder: string;
  passwordTitle: (name: string, role: string) => string;
  passwordPlaceholder: string;
  passwordEnter: string;
  passwordWrong: string;
  passwordLocked: string;
  unknown: string;
  returnBtn: string;
  send: string;
  thinking: string;
  completeTitle: (name: string) => string;
  completeSub: string;
  rankAchieved: string;
  returnSurface: string;
  inputPlaceholder: string;
  dir: "ltr" | "rtl";
}

export const I18N: Record<Lang, Pack> = {
  en: {
    selfDefPrompt: "Before you may enter... tell me who you are. Define yourself, Hunter.",
    selfDefPlaceholder: "Speak your name, your purpose...",
    passwordTitle: (n, r) =>
      `Ah... ${n}. I've been expecting you. You seek the role of ${r}. Prove you are worthy. Enter your access code.`,
    passwordPlaceholder: "Enter your access code...",
    passwordEnter: "Unlock the Gate",
    passwordWrong: "The shadows do not recognize you. Access denied.",
    passwordLocked: "The gate has sealed itself. Return to the surface, mortal.",
    unknown:
      "I do not know this soul. You are not in my records, Hunter. The dungeon does not open for strangers.",
    returnBtn: "Return",
    send: "Send",
    thinking: "the gate is opening...",
    completeTitle: (n) => `Interview Complete, ${n}.`,
    completeSub: "Your fate has been recorded.",
    rankAchieved: "Rank Achieved",
    returnSurface: "Return to the Surface",
    inputPlaceholder: "Speak your answer...",
    dir: "ltr",
  },
  fr: {
    selfDefPrompt: "Avant d'entrer... dis-moi qui tu es. Définis-toi, Chasseur.",
    selfDefPlaceholder: "Prononce ton nom, ton dessein...",
    passwordTitle: (n, r) =>
      `Ah... ${n}. Je t'attendais. Tu vises le rôle de ${r}. Prouve que tu en es digne. Entre ton code d'accès.`,
    passwordPlaceholder: "Entre ton code d'accès...",
    passwordEnter: "Ouvrir la Porte",
    passwordWrong: "Les ombres ne te reconnaissent pas. Accès refusé.",
    passwordLocked: "La porte s'est scellée. Retourne à la surface, mortel.",
    unknown:
      "Je ne connais pas cette âme. Tu n'es pas dans mes registres, Chasseur. Le donjon ne s'ouvre pas aux étrangers.",
    returnBtn: "Retour",
    send: "Envoyer",
    thinking: "la porte s'ouvre...",
    completeTitle: (n) => `Entretien terminé, ${n}.`,
    completeSub: "Ton destin a été inscrit.",
    rankAchieved: "Rang Obtenu",
    returnSurface: "Retourner à la Surface",
    inputPlaceholder: "Prononce ta réponse...",
    dir: "ltr",
  },
  zh: {
    selfDefPrompt: "在你进入之前……告诉我你是谁。向我介绍你自己，猎人。",
    selfDefPlaceholder: "说出你的名字，你的目的……",
    passwordTitle: (n, r) =>
      `啊……${n}。我一直在等你。你寻求的是 ${r} 这个职位。证明你的价值。请输入你的访问码。`,
    passwordPlaceholder: "输入你的访问码……",
    passwordEnter: "解锁大门",
    passwordWrong: "黑暗不认识你。访问被拒绝。",
    passwordLocked: "大门已封印。凡人，回到地面吧。",
    unknown:
      "我不认识这个灵魂。你不在我的记录中，猎人。地下城不为陌生人开放。",
    returnBtn: "返回",
    send: "发送",
    thinking: "大门正在开启……",
    completeTitle: (n) => `面试完成，${n}。`,
    completeSub: "你的命运已被记录。",
    rankAchieved: "达到等级",
    returnSurface: "返回地面",
    inputPlaceholder: "说出你的答案……",
    dir: "ltr",
  },
};
