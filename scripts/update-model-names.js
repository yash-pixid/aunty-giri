import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modelsDir = path.join(__dirname, '../models');

// List of model files to update
const modelFiles = [
  'activity.js',
  'screenshot.js',
  'keystroke.js',
  'systemMetric.js'
];

// Function to update a model file
function updateModelFile(fileName) {
  const filePath = path.join(modelsDir, fileName);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add tableName and freezeTableName options
    if (content.includes('timestamps: true')) {
      const modelName = fileName.replace('.js', '');
      const tableName = modelName.charAt(0).toUpperCase() + modelName.slice(1) + 's';
      
      const updatedContent = content.replace(
        /timestamps: true([^}]*)\}/,
        `timestamps: true,\n    tableName: '${tableName}',\n    freezeTableName: true\}`
      );
      
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated ${fileName} with tableName: '${tableName}'`);
    } else {
      console.log(`ℹ️  No changes needed for ${fileName}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${fileName}:`, error.message);
  }
}

// Update all model files
console.log('Updating model table names...\n');
modelFiles.forEach(updateModelFile);
console.log('\n✅ All model files have been updated.');
