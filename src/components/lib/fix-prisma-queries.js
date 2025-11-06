const fs = require('fs');
const path = require('path');

// Files that need to be updated
const filesToFix = [
  'app/sale/page.tsx',
  'app/product/[id]/page.tsx',
  'app/collections/summer/page.tsx',
  'app/category/[slug]/page.tsx',
  'app/api/virtual-try-on/products/route.ts',
  'app/api/search/route.ts',
  'app/api/orders/route.ts'
];

// Process each file
filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }
  
  // Read file content
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace problematic isActive queries
  const updatedContent = content
    // Replace product isActive references
    .replace(/isActive:\s*['"]yes['"]/g, 'isArchived: false')
    // Replace category isActive references
    .replace(/category:\s*{\s*isActive:\s*['"]yes['"]\s*}/g, '');
  
  // Write updated content back to file
  fs.writeFileSync(fullPath, updatedContent);
  
  console.log(`Updated: ${filePath}`);
});

console.log('All files processed.');
