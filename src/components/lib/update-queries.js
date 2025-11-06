const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript/JavaScript files in a directory
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
      fileList = findFiles(filePath, fileList);
    } else if (
      stat.isFile() && 
      (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))
    ) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Find all TypeScript/JavaScript files in the project
const projectRoot = process.cwd();
const allFiles = findFiles(projectRoot);

// Counter for modified files
let modifiedCount = 0;

// Process each file
allFiles.forEach(filePath => {
  try {
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Replace problematic isActive queries in Product model
    content = content.replace(/isActive:\s*['"]yes['"]/g, 'isArchived: false');
    
    // Remove category isActive references
    content = content.replace(/category:\s*{\s*isActive:\s*['"]yes['"]\s*}/g, '');
    
    // If content was modified, write it back to the file
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated: ${path.relative(projectRoot, filePath)}`);
      modifiedCount++;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log(`\nCompleted: Modified ${modifiedCount} files.`);
