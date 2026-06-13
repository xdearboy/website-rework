const WINDOWS_1251_TABLE: Record<string, number> = {
  Ђ: 0x80,
  Ѓ: 0x81,
  '‚': 0x82,
  ѓ: 0x83,
  '„': 0x84,
  '…': 0x85,
  '†': 0x86,
  '‡': 0x87,
  '€': 0x88,
  '‰': 0x89,
  Љ: 0x8a,
  '‹': 0x8b,
  Њ: 0x8c,
  Ќ: 0x8d,
  Ћ: 0x8e,
  Џ: 0x8f,
  ђ: 0x90,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
  '™': 0x99,
  љ: 0x9a,
  '›': 0x9b,
  њ: 0x9c,
  ќ: 0x9d,
  ћ: 0x9e,
  џ: 0x9f,
  Ў: 0xa1,
  ў: 0xa2,
  Ј: 0xa3,
  '¤': 0xa4,
  Ґ: 0xa5,
  '¦': 0xa6,
  '§': 0xa7,
  Ё: 0xa8,
  '©': 0xa9,
  Є: 0xaa,
  '«': 0xab,
  '¬': 0xac,
  '­': 0xad,
  '®': 0xae,
  Ї: 0xaf,
  '°': 0xb0,
  '±': 0xb1,
  І: 0xb2,
  і: 0xb3,
  ґ: 0xb4,
  µ: 0xb5,
  '¶': 0xb6,
  '·': 0xb7,
  ё: 0xb8,
  '№': 0xb9,
  є: 0xba,
  '»': 0xbb,
  ј: 0xbc,
  Ѕ: 0xbd,
  ѕ: 0xbe,
  ї: 0xbf,
};

function encodeWindows1251(input: string): Uint8Array {
  const bytes: number[] = [];

  for (const char of input) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) {
      continue;
    }

    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
      continue;
    }

    if (codePoint >= 0x410 && codePoint <= 0x44f) {
      bytes.push(codePoint - 0x350);
      continue;
    }

    const mapped = WINDOWS_1251_TABLE[char];
    if (mapped !== undefined) {
      bytes.push(mapped);
      continue;
    }

    return new Uint8Array();
  }

  return Uint8Array.from(bytes);
}

function looksLikeMojibake(input: string): boolean {
  return /(?:Р.|С.|Ñ.|Ð.)/.test(input);
}

export function decodeMojibake(input: string | undefined): string | undefined {
  if (!input || !looksLikeMojibake(input)) {
    return input;
  }

  try {
    const bytes = encodeWindows1251(input);
    if (bytes.length === 0) {
      return input;
    }

    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    return decoded.includes('\uFFFD') ? input : decoded;
  } catch {
    return input;
  }
}
