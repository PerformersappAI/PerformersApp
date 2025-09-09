export interface DialogueLine {
  character: string;
  text: string;
  lineNumber: number;
}

export interface ScriptParsing {
  characters: string[];
  dialogues: DialogueLine[];
  isPlainText: boolean;
}

// Helper function to clean and validate extracted text
const preprocessScript = (text: string): string => {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
    .replace(/\u2018|\u2019/g, "'") // Replace smart quotes
    .replace(/\u201C|\u201D/g, '"') // Replace smart double quotes
    .replace(/\u2013|\u2014/g, '-') // Replace em/en dashes
    .replace(/\t/g, '    ') // Replace tabs with spaces
    // Remove unwanted symbols and formatting artifacts
    .replace(/^\*\s*$/gm, '') // Remove lines with only asterisks
    .replace(/^\*\s*\n/gm, '') // Remove asterisk-only lines
    .replace(/\*\s*$/gm, '') // Remove trailing asterisks
    .replace(/^\s*\*\s*/gm, '') // Remove leading asterisks
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up excessive line breaks
    .trim();
};

export const parseScript = (scriptText: string): ScriptParsing => {
  // Preprocess the script text
  const cleanedScript = preprocessScript(scriptText);
  const lines = cleanedScript.split('\n');
  const characters = new Set<string>();
  const dialogues: DialogueLine[] = [];

  console.log('=== SCRIPT PARSER DEBUG ===');
  console.log('Parsing script with', lines.length, 'lines');

  // Helper function to detect action lines and stage directions that should be ignored
  const isActionLine = (line: string): boolean => {
    const trimmed = line.trim();
    
    // Check if it's an ALL CAPS line that's likely a stage direction/action
    const isAllCaps = trimmed === trimmed.toUpperCase() && trimmed.length > 5 && /[A-Z]/.test(trimmed);
    if (isAllCaps) {
      // Enhanced action words detection
      const actionWords = [
        'LOOKS', 'WALKS', 'RUNS', 'SITS', 'STANDS', 'ENTERS', 'EXITS', 'MOVES', 'TURNS',
        'GRABS', 'HOLDS', 'OPENS', 'CLOSES', 'POINTS', 'NODS', 'SHAKES', 'SMILES',
        'CAMERA', 'PLEADING', 'STARING', 'WATCHING', 'LISTENING', 'WAITING',
        'SUDDENLY', 'QUICKLY', 'SLOWLY', 'CAREFULLY', 'FRANTICALLY',
        'BEGINS', 'CONTINUES', 'STOPS', 'PAUSES', 'HESITATES', 'APPROACHES',
        'DEPARTS', 'RETURNS', 'FOLLOWS', 'LEADS', 'PUSHES', 'PULLS', 'LIFTS'
      ];
      
      // If it's all caps and contains action words, it's likely a stage direction
      if (actionWords.some(word => trimmed.includes(word))) {
        return true;
      }
    }
    
    return false;
  };

  // Helper function to detect scene or technical directions
  const isSceneOrTechnical = (line: string): boolean => {
    const trimmed = line.trim().toUpperCase();
    
    // Enhanced technical patterns
    const technicalPatterns = [
      /^(INT\.|EXT\.|FADE|CUT|DISSOLVE|MONTAGE|FLASHBACK|TITLE|CAPTION)/,
      /^(SCENE|ACT|CHAPTER|PART)\s*\d+/,
      /^(CONTINUED|CONT'D|MORE|OVER|INTERCUT)/,
      /^\d+\./, // Scene numbers
      /^(MUSIC|SOUND|SFX|FX|AUDIO):/,
      /^(NARRATOR|ANNOUNCER|VOICE\s+OVER):/,
      /^(SUPER|GRAPHIC|TEXT\s+ON\s+SCREEN)/,
      /^(BEGIN|END)\s+(SCENE|ACT|FLASHBACK)/,
      /^(MORNING|EVENING|NIGHT|DAY|LATER|EARLIER)/,
      /^(MEANWHILE|SIMULTANEOUSLY|AT\s+THE\s+SAME\s+TIME)/,
    ];
    
    return technicalPatterns.some(pattern => pattern.test(trimmed));
  };

  // Simplified parsing - focus on UPPERCASE character names followed by dialogue
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Skip obvious action lines and stage directions
    if (isActionLine(line) || isSceneOrTechnical(line)) {
      continue;
    }

    // Check if this line is a character name (UPPERCASE line)
    const isCharacterName = line === line.toUpperCase() && 
                           line.length >= 2 && 
                           line.length <= 50 && 
                           /^[A-Z][A-Z\s\-'\.]*$/.test(line) &&
                           !line.includes(':') &&
                           isValidCharacterName(line);

    if (isCharacterName) {
      const characterName = line.trim();
      characters.add(characterName);
      
      // Look for dialogue in next line(s)
      let dialogueText = '';
      let nextLineIndex = i + 1;
      
      // Collect dialogue lines until we hit another character name or empty line
      while (nextLineIndex < lines.length) {
        const nextLine = lines[nextLineIndex].trim();
        
        // Stop if empty line or another character name
        if (!nextLine) break;
        
        const nextIsCharacter = nextLine === nextLine.toUpperCase() && 
                               nextLine.length >= 2 && 
                               nextLine.length <= 50 && 
                               /^[A-Z][A-Z\s\-'\.]*$/.test(nextLine) &&
                               !nextLine.includes(':') &&
                               isValidCharacterName(nextLine);
        
        if (nextIsCharacter || isActionLine(nextLine) || isSceneOrTechnical(nextLine)) {
          break;
        }
        
        // Add this line to dialogue
        if (dialogueText) {
          dialogueText += ' ' + nextLine;
        } else {
          dialogueText = nextLine;
        }
        
        nextLineIndex++;
      }
      
      // Add dialogue if we found any
      if (dialogueText) {
        dialogues.push({
          character: characterName,
          text: dialogueText,
          lineNumber: i + 1
        });
      }
      
      // Skip the lines we processed
      i = nextLineIndex - 1;
      continue;
    }
    
    // Check for standard format: CHARACTER: dialogue
    const colonMatch = line.match(/^([A-Z][A-Z\s\-'\.]*?):\s*(.+)$/);
    if (colonMatch) {
      const characterName = colonMatch[1].trim();
      const dialogueText = colonMatch[2].trim();
      
      if (isValidCharacterName(characterName) && dialogueText) {
        characters.add(characterName);
        dialogues.push({
          character: characterName,
          text: dialogueText,
          lineNumber: i + 1
        });
      }
    }
  }

  const finalCharacters = Array.from(characters);
  let finalDialogues = dialogues;
  
  // If no characters found, treat as plain text
  const isPlainText = finalCharacters.length === 0;
  if (isPlainText && scriptText.trim()) {
    console.log('No characters detected, treating as plain text');
    const textLines = scriptText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !isActionLine(line) && !isSceneOrTechnical(line));
    
    finalDialogues = textLines.map((line, index) => ({
      character: 'SPEAKER',
      text: line,
      lineNumber: index + 1
    }));
    
    if (finalDialogues.length > 0) {
      finalCharacters.push('SPEAKER');
    }
  }
  
  console.log('Final parsed characters:', finalCharacters);
  console.log('Total dialogue lines:', finalDialogues.length);
  console.log('Is plain text:', isPlainText);
  console.log('=== END SCRIPT PARSER DEBUG ===');

  return {
    characters: finalCharacters,
    dialogues: finalDialogues,
    isPlainText
  };
};

// Helper function to validate character names - enhanced strict validation
function isValidCharacterName(name: string): boolean {
  // Basic length and content checks
  if (name.length < 2 || name.length > 30) return false;
  if (!/[A-Z]/i.test(name)) return false;
  
  // Must be primarily letters with allowed characters
  if (!/^[A-Za-z\s\.'\-]+$/.test(name)) return false;
  
  // Strict word count - character names should be 1-3 words max
  const words = name.trim().split(/\s+/);
  if (words.length > 3) return false;
  
  // Reject dialogue patterns
  const dialoguePatterns = [
    /^(INCREDIBLE|CONGRATULATIONS|READY|ORDERS|WINNER|HAVOC|CRIMSON)/i,
    /\b(READY\s+FOR|WINNER\s+OF|CONGRATULATIONS)\b/i,
    /^(YES|NO|OKAY|FINE|GOOD|GREAT|AMAZING|INCREDIBLE)\s/i,
    /\b(LOOKS|SAYS|TELLS|ASKS|ANSWERS|REPLIES|RESPONDS)\b/i
  ];
  
  for (const pattern of dialoguePatterns) {
    if (pattern.test(name)) return false;
  }
  
  // Exclude technical terms and stage directions
  const invalidPatterns = [
    /^(FADE|CUT|INT|EXT|ZOOM|CLOSE|WIDE|MEDIUM|SHOT)/i,
    /^(MUSIC|SOUND|SFX|VOICE|NARRATOR|ANNOUNCER)/i,
    /^(CONTINUED|SCENE|ACT|END|TITLE|CREDITS)/i,
    /(LOOKS|WALKS|RUNS|SITS|STANDS|ENTERS|EXITS|MOVES|TURNS)/i,
    /(CAMERA|ANGLE|SHOT|FRAME|PLEADING|STARING|WATCHING)/i,
    /^(MEANWHILE|LATER|EARLIER|FLASHBACK|MONTAGE)/i,
    /^(HE|SHE|THEY|WE|YOU|I)\s/i,
    /^(THE|A|AN)\s/i,
    /^(AND|BUT|OR|SO|THEN|NOW|WELL)\s/i
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(name)) return false;
  }
  
  // Common phrases that get misidentified as character names
  const invalidPhrases = [
    'VOICE', 'NARRATOR', 'ANNOUNCER', 'TITLE', 'CREDITS', 'SPEAKER',
    'LEON READY', 'READY FOR', 'WINNER OF', 'THEA WINNER',
    'CRIMSON HAVOC', 'CLEOPATRA VII'
  ];
  
  const upperName = name.toUpperCase();
  for (const phrase of invalidPhrases) {
    if (upperName.includes(phrase)) return false;
  }
  
  // Each word should look like a proper name
  for (const word of words) {
    // Each word should be 2+ characters
    if (word.length < 2) return false;
    
    // Avoid common non-name words
    const nonNameWords = [
      'FOR', 'THE', 'AND', 'BUT', 'YOU', 'ARE', 'CAN', 'WILL', 'WAS',
      'HAVE', 'BEEN', 'WERE', 'THEY', 'THEM', 'THIS', 'THAT', 'WITH',
      'FROM', 'INTO', 'OVER', 'BACK', 'DOWN', 'ONLY', 'JUST', 'LIKE',
      'WHAT', 'WHEN', 'WHERE', 'READY', 'WINNER', 'ORDERS'
    ];
    
    if (nonNameWords.includes(word.toUpperCase())) {
      return false;
    }
  }
  
  return true;
}

export const getCharacterLines = (dialogues: DialogueLine[], character: string): DialogueLine[] => {
  return dialogues.filter(d => d.character === character);
};

export const getOtherCharacterLines = (dialogues: DialogueLine[], excludeCharacter: string): DialogueLine[] => {
  return dialogues.filter(d => d.character !== excludeCharacter);
};
