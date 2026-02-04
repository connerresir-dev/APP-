import type { GameInfo, GameType } from '@/types';

export const GAMES: Record<GameType, GameInfo> = {
  bullshit: {
    id: 'bullshit',
    name: 'Bullshit',
    description: 'Bluffe deine Freunde! Lege Karten verdeckt ab und behaupte einen Wert. Wer dich erwischt, muss den Stapel aufnehmen.',
    maxPlayers: 10,
    minPlayers: 2,
    icon: '🃏',
    color: 'from-amber-500 to-orange-600',
  },
  schwimmen: {
    id: 'schwimmen',
    name: 'Schwimmen (31)',
    description: 'Sammle 31 Punkte in einer Farbe oder 30,5 mit drei gleichen Karten. Tausche klug oder klopfe zur letzten Runde.',
    maxPlayers: 9,
    minPlayers: 2,
    icon: '🌊',
    color: 'from-cyan-500 to-blue-600',
  },
  blackjack: {
    id: 'blackjack',
    name: 'Blackjack',
    description: 'Komme so nah wie möglich an 21 heran, ohne sie zu überschreiten. Schlage den Dealer!',
    maxPlayers: 8,
    minPlayers: 1,
    icon: '🎰',
    color: 'from-emerald-500 to-green-600',
  },
  poker: {
    id: 'poker',
    name: 'Texas Hold\'em',
    description: 'Die Königin der Kartenspiele. Setze strategisch und bilde die beste Hand mit deinen Karten und den Community-Karten.',
    maxPlayers: 8,
    minPlayers: 2,
    icon: '♠️',
    color: 'from-violet-500 to-purple-600',
  },
  uno: {
    id: 'uno',
    name: 'UNO',
    description: 'Der Klassiker! Spiele Karten nach Farbe oder Zahl. Vergiss nicht "UNO" zu rufen!',
    maxPlayers: 10,
    minPlayers: 2,
    icon: '🎴',
    color: 'from-rose-500 to-red-600',
  },
};

export const GAME_RULES: Record<GameType, {
  basicRules: string[];
  customRules: { id: string; name: string; description: string; defaultValue: boolean }[];
}> = {
  bullshit: {
    basicRules: [
      'Alle Karten werden gleichmäßig an die Spieler verteilt',
      'Der erste Spieler legt 1-4 Karten verdeckt ab und nennt einen Wert (z.B. "zwei Sechser")',
      'Die Karten müssen tatsächlich den genannten Wert haben - oder der Spieler blufft',
      'Der nächste Spieler kann "Bullshit" rufen, um den Bluff zu prüfen',
      'War es ein Bluff, muss der Lügner den gesamten Stapel aufnehmen',
      'War es kein Bluff, muss derjenige, der "Bullshit" gerufen hat, den Stapel aufnehmen',
      'Wer zuerst alle Karten loswird, gewinnt',
    ],
    customRules: [
      {
        id: 'bullshitMultipleCards',
        name: 'Mehrere Karten gleichzeitig',
        description: 'Erlaube das Ablegen von mehreren Karten mit demselben Wert auf einmal',
        defaultValue: true,
      },
    ],
  },
  schwimmen: {
    basicRules: [
      'Jeder Spieler erhält 3 Karten',
      'Es gibt 3 Karten offen in der Mitte (Tisch)',
      'Ziel: 31 Punkte in einer Farbe oder 30,5 mit drei gleichen Karten',
      'In deinem Zug: Tausche 1-3 Karten mit dem Tisch oder klopfe an',
      'Wer klopft, startet die letzte Runde',
      'Nach der letzten Runde wird aufgedeckt - wer die niedrigste Punktzahl hat, verliert ein Leben',
      'Wer 3 Leben verliert, scheidet aus ("ertrinkt")',
    ],
    customRules: [
      {
        id: 'schwimmenThreeAces',
        name: 'Drei Asse = 33 Punkte',
        description: 'Drei Asse zählen als 33 Punkte und schlagen 31',
        defaultValue: true,
      },
      {
        id: 'schwimmenFire',
        name: 'Feuer-Regel',
        description: 'Drei Siebener geben sofort 30,5 Punkte und beenden die Runde',
        defaultValue: false,
      },
    ],
  },
  blackjack: {
    basicRules: [
      'Ziel: Komme so nah wie möglich an 21 Punkte, ohne sie zu überschreiten',
      'Zahlenkarten: Nennwert, Bildkarten: 10 Punkte, Asse: 1 oder 11 Punkte',
      'Der Dealer zieht Karten bis er mindestens 17 Punkte hat',
      'Hit: Nimm eine weitere Karte',
      'Stand: Beende deinen Zug',
      'Double Down: Verdopple deinen Einsatz und erhalte genau eine Karte',
      'Split: Bei zwei gleichen Karten kannst du sie trennen und zwei Hände spielen',
      'Blackjack (Ass + 10er-Karte) gewinnt sofort',
    ],
    customRules: [
      {
        id: 'blackjackSurrender',
        name: 'Surrender',
        description: 'Erlaube das Aufgeben und Rückerstattung der Hälfte des Einsatzes',
        defaultValue: true,
      },
      {
        id: 'blackjackInsurance',
        name: 'Insurance',
        description: 'Erlaube eine Versicherung, wenn der Dealer ein Ass zeigt',
        defaultValue: true,
      },
    ],
  },
  poker: {
    basicRules: [
      'Jeder Spieler erhält 2 verdeckte Karten (Hole Cards)',
      'Pre-Flop: Erste Setzrunde',
      'Flop: 3 Community-Karten werden aufgedeckt',
      'Turn: 4. Community-Karte wird aufgedeckt',
      'River: 5. Community-Karte wird aufgedeckt',
      'Bilde die beste 5-Karten-Hand aus deinen 2 und den 5 Community-Karten',
      'Hand-Ränge (hoch zu niedrig): Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair, Pair, High Card',
    ],
    customRules: [
      {
        id: 'pokerStraddle',
        name: 'Straddle',
        description: 'Erlaube einen Straddle (doppelter Big Blind)',
        defaultValue: false,
      },
      {
        id: 'pokerRunItTwice',
        name: 'Run it Twice',
        description: 'Bei All-in: Zeige die verbleibenden Karten zweimal an',
        defaultValue: false,
      },
    ],
  },
  uno: {
    basicRules: [
      'Jeder Spieler erhält 7 Karten',
      'Eine Karte wird offen als Ablagestapel gelegt',
      'Spiele eine Karte, die in Farbe oder Zahl passt',
      'Aktionskarten: +2 (nächster zieht 2), +4 (nächster zieht 4 + Farbwahl), Richtungswechsel, Aussetzen, Farbwunsch',
      'Kannst du nicht spielen, ziehe eine Karte',
      'Bei der vorletzten Karte: Ruf "UNO"!',
      'Vergisst du "UNO", musst du 2 Karten ziehen',
      'Wer zuerst alle Karten loswird, gewinnt',
    ],
    customRules: [
      {
        id: 'unoStacking',
        name: 'Stapeln',
        description: 'Erlaube das Stapeln von +2 und +4 Karten',
        defaultValue: true,
      },
      {
        id: 'unoJumpIn',
        name: 'Jump-In',
        description: 'Spieler können jederzeit einspringen, wenn sie die gleiche Karte haben',
        defaultValue: false,
      },
      {
        id: 'unoDrawTillPlay',
        name: 'Ziehen bis spielbar',
        description: 'Ziehe so lange, bis du eine spielbare Karte hast',
        defaultValue: false,
      },
    ],
  },
};

export const AVATARS = [
  '🦊', '🐼', '🐨', '🐯', '🦁', '🐸', '🐙', '🦄',
  '🐙', '🦉', '🐺', '🐗', '🐴', '🐝', '🐛', '🦋',
  '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢',
  '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞',
];

export const CARD_BACK_PATTERNS = [
  'wood',
  'fabric',
  'geometric',
  'classic',
];
