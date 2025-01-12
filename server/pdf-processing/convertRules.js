const fs = require('fs');
const pdfParse = require('pdf-parse');
const path = require('path');

const pdfPath = path.join(__dirname, '../data/rules.pdf');
const outputPath = path.join(__dirname, '../data/gameRules.json');

const extractRulesFromPDF = async () => {
  try {
    console.log('Starting PDF extraction...');
    console.log('Looking for PDF at:', pdfPath);

    // Check if PDF exists
    if (!fs.existsSync(pdfPath)) {
      throw new Error('PDF file not found at ' + pdfPath);
    }

    console.log('Reading PDF file...');
    const dataBuffer = fs.readFileSync(pdfPath);
    
    console.log('Parsing PDF content...');
    const data = await pdfParse(dataBuffer);
    
    console.log('PDF text content length:', data.text.length);
    console.log('First 500 characters:', data.text.substring(0, 500));
    
    console.log('Parsing rules from text...');
    const rules = parseRules(data.text);
    
    console.log('Writing rules to JSON file...');
    fs.writeFileSync(outputPath, JSON.stringify(rules, null, 2));
    console.log('Rules successfully saved to:', outputPath);
  } catch (error) {
    console.error('Error during PDF processing:', error);
    process.exit(1);
  }
};

const parseRules = (text) => {
  console.log('Starting rules parsing...');
  const lines = text.split('\n').filter(line => line.trim() !== '');
  
  const rules = {
    phases: [],
    summoning: {
      normal: {
        limit: 1,
        requirements: {}
      },
      tribute: {
        requirements: {}
      }
    },
    battle: {
      steps: [],
      damage: {}
    },
    cardTypes: {},
    effects: {}
  };

  let currentSection = null;

  lines.forEach((line, index) => {
    console.log(`Processing line ${index}:`, line.substring(0, 50));
    
    // Phase detection
    if (line.match(/phase|step/i)) {
      if (line.includes('Draw Phase')) rules.phases.push('DRAW_PHASE');
      if (line.includes('Standby Phase')) rules.phases.push('STANDBY_PHASE');
      if (line.includes('Main Phase')) rules.phases.push('MAIN_PHASE_1');
      if (line.includes('Battle Phase')) rules.phases.push('BATTLE_PHASE');
      if (line.includes('End Phase')) rules.phases.push('END_PHASE');
    }

    // Summoning rules
    if (line.match(/summon|tribute/i)) {
      if (line.includes('Normal Summon')) {
        currentSection = 'normal_summon';
      }
      if (line.includes('Tribute')) {
        currentSection = 'tribute';
      }
    }

    // Battle rules
    if (line.match(/battle|attack|damage/i)) {
      if (!rules.battle.steps.includes(line.trim())) {
        rules.battle.steps.push(line.trim());
      }
    }
  });

  console.log('Finished parsing rules');
  console.log('Parsed rules structure:', JSON.stringify(rules, null, 2));
  
  return rules;
};

console.log('Starting PDF conversion process...');
extractRulesFromPDF().catch(error => {
  console.error('Failed to process PDF:', error);
  process.exit(1);
}); 