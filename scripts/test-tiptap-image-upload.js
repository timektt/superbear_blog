/**
 * Tiptap + Image Upload Integration Testing Script
 * Run this in the browser console while logged in as admin
 */

// Test utilities
const BASE_URL = window.location.origin;

// Helper function to create test images
function createTestImageFile(name = 'test-image.jpg', size = 1024 * 100) {
  // Create a canvas and convert to blob
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  
  // Draw a simple test pattern
  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(0, 0, 100, 100);
  ctx.fillStyle = '#4ecdc4';
  ctx.fillRect(100, 0, 100, 100);
  ctx.fillStyle = '#45b7d1';
  ctx.fillRect(0, 100, 100, 100);
  ctx.fillStyle = '#f9ca24';
  ctx.fillRect(100, 100, 100, 100);
  
  // Add text
  ctx.fillStyle = '#2c2c2c';
  ctx.font = '16px Arial';
  ctx.fillText('Test Image', 60, 105);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], name, { type: 'image/jpeg' });
      resolve(file);
    }, 'image/jpeg', 0.8);
  });
}

// Helper function to create oversized test image
async function createOversizedTestImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 4000;
  canvas.height = 4000;
  const ctx = canvas.getContext('2d');
  
  // Fill with gradient to make it large
  const gradient = ctx.createLinearGradient(0, 0, 4000, 4000);
  gradient.addColorStop(0, '#ff6b6b');
  gradient.addColorStop(1, '#4ecdc4');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4000, 4000);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], 'oversized-test.jpg', { type: 'image/jpeg' });
      resolve(file);
    }, 'image/jpeg', 1.0); // Max quality to ensure large size
  });
}

// Test functions
async function testImageUploadAPI() {
  console.log('🔍 Testing Image Upload API...');
  
  try {
    const testFile = await createTestImageFile('api-test.jpg');
    const formData = new FormData();
    formData.append('file', testFile);
    
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Image upload API works');
      console.log('  - URL:', result.data.url);
      console.log('  - Public ID:', result.data.publicId);
      console.log('  - Dimensions:', `${result.data.width}x${result.data.height}`);
      return result.data;
    } else {
      console.log('❌ Image upload API failed');
      console.log('  - Status:', response.status);
      console.log('  - Error:', result.error || result.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Image upload API error:', error.message);
    return null;
  }
}

async function testOversizedImageUpload() {
  console.log('🔍 Testing Oversized Image Upload (should fail)...');
  
  try {
    const oversizedFile = await createOversizedTestImage();
    console.log(`  - File size: ${(oversizedFile.size / 1024 / 1024).toFixed(2)}MB`);
    
    const formData = new FormData();
    formData.append('file', oversizedFile);
    
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (!response.ok && result.error) {
      console.log('✅ Oversized image correctly rejected');
      console.log('  - Error:', result.error);
      return true;
    } else {
      console.log('❌ Oversized image was not rejected (this is a problem)');
      return false;
    }
  } catch (error) {
    console.log('❌ Oversized image test error:', error.message);
    return false;
  }
}

async function testInvalidFileTypeUpload() {
  console.log('🔍 Testing Invalid File Type Upload (should fail)...');
  
  try {
    // Create a fake text file with image extension
    const textFile = new File(['This is not an image'], 'fake-image.txt', { 
      type: 'text/plain' 
    });
    
    const formData = new FormData();
    formData.append('file', textFile);
    
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (!response.ok && result.error) {
      console.log('✅ Invalid file type correctly rejected');
      console.log('  - Error:', result.error);
      return true;
    } else {
      console.log('❌ Invalid file type was not rejected (this is a problem)');
      return false;
    }
  } catch (error) {
    console.log('❌ Invalid file type test error:', error.message);
    return false;
  }
}

function testTiptapEditorPresence() {
  console.log('🔍 Testing Tiptap Editor Presence...');
  
  // Look for Tiptap editor elements
  const editorContent = document.querySelector('.ProseMirror');
  const editorToolbar = document.querySelector('[role="toolbar"], .editor-toolbar');
  const imageButton = document.querySelector('button[title*="Image"], button[title*="image"]');
  
  console.log('Editor content element:', editorContent ? '✅ Found' : '❌ Not found');
  console.log('Editor toolbar:', editorToolbar ? '✅ Found' : '❌ Not found');
  console.log('Image button:', imageButton ? '✅ Found' : '❌ Not found');
  
  if (editorContent) {
    console.log('  - Editor is editable:', editorContent.contentEditable);
    console.log('  - Editor has content:', editorContent.textContent.length > 0);
  }
  
  return {
    hasEditor: !!editorContent,
    hasToolbar: !!editorToolbar,
    hasImageButton: !!imageButton,
    editorElement: editorContent
  };
}

function testEditorImageInsertion(imageUrl) {
  console.log('🔍 Testing Editor Image Insertion...');
  
  const editorInfo = testTiptapEditorPresence();
  
  if (!editorInfo.hasEditor) {
    console.log('❌ Cannot test image insertion - no editor found');
    return false;
  }
  
  try {
    // Try to insert image programmatically
    const editor = editorInfo.editorElement;
    
    // Create image element
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Test image';
    img.className = 'max-w-full h-auto rounded-lg shadow-sm mx-auto block';
    
    // Insert at cursor position or at the end
    if (editor.childNodes.length === 0) {
      const p = document.createElement('p');
      editor.appendChild(p);
    }
    
    editor.appendChild(img);
    
    // Trigger input event to notify Tiptap
    const event = new Event('input', { bubbles: true });
    editor.dispatchEvent(event);
    
    console.log('✅ Image inserted into editor');
    return true;
  } catch (error) {
    console.log('❌ Failed to insert image into editor:', error.message);
    return false;
  }
}

function testEditorContentSerialization() {
  console.log('🔍 Testing Editor Content Serialization...');
  
  const editorInfo = testTiptapEditorPresence();
  
  if (!editorInfo.hasEditor) {
    console.log('❌ Cannot test serialization - no editor found');
    return null;
  }
  
  try {
    // Look for any form data or hidden inputs that might contain serialized content
    const forms = document.querySelectorAll('form');
    let serializedContent = null;
    
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input[type="hidden"], textarea');
      inputs.forEach(input => {
        if (input.value && input.value.includes('"type":"doc"')) {
          serializedContent = input.value;
        }
      });
    });
    
    if (serializedContent) {
      try {
        const parsed = JSON.parse(serializedContent);
        console.log('✅ Found serialized editor content');
        console.log('  - Type:', parsed.type);
        console.log('  - Content blocks:', parsed.content?.length || 0);
        
        // Check for images in content
        const hasImages = JSON.stringify(parsed).includes('"type":"image"');
        console.log('  - Contains images:', hasImages ? 'Yes' : 'No');
        
        return parsed;
      } catch (e) {
        console.log('❌ Found content but failed to parse JSON');
        return null;
      }
    } else {
      console.log('⚠️ No serialized content found');
      return null;
    }
  } catch (error) {
    console.log('❌ Error testing serialization:', error.message);
    return null;
  }
}

async function testImageCleanupOnDelete() {
  console.log('🔍 Testing Image Cleanup on Article Delete...');
  console.log('⚠️ This test requires manual verification');
  console.log('Steps to test:');
  console.log('1. Create an article with an image');
  console.log('2. Note the Cloudinary URL');
  console.log('3. Delete the article');
  console.log('4. Check if the image still exists at the Cloudinary URL');
  console.log('5. Expected: Image should be deleted (404 error)');
  
  return 'manual-test-required';
}

function testImageURLValidation() {
  console.log('🔍 Testing Image URL Validation...');
  
  const testUrls = [
    'https://res.cloudinary.com/demo/image/upload/sample.jpg', // Valid Cloudinary
    'https://example.com/image.jpg', // Valid external
    'invalid-url', // Invalid URL
    'ftp://example.com/image.jpg', // Invalid protocol
    'javascript:alert("xss")', // XSS attempt
    '', // Empty string
  ];
  
  testUrls.forEach(url => {
    try {
      if (url === '') {
        console.log(`  - Empty URL: ✅ Should be allowed (optional field)`);
        return;
      }
      
      new URL(url);
      
      if (url.startsWith('javascript:') || url.startsWith('data:')) {
        console.log(`  - "${url}": ❌ Should be rejected (security risk)`);
      } else {
        console.log(`  - "${url}": ✅ Valid URL format`);
      }
    } catch (e) {
      console.log(`  - "${url}": ❌ Invalid URL format`);
    }
  });
}

function testImagePreviewAndRemoval() {
  console.log('🔍 Testing Image Preview and Removal...');
  
  // Look for image preview elements
  const imagePreview = document.querySelector('img[alt*="Uploaded"], img[alt*="preview"], .image-preview img');
  const removeButton = document.querySelector('button[title*="Remove"], button[title*="remove"], .remove-image');
  
  console.log('Image preview:', imagePreview ? '✅ Found' : '❌ Not found');
  console.log('Remove button:', removeButton ? '✅ Found' : '❌ Not found');
  
  if (imagePreview) {
    console.log('  - Preview src:', imagePreview.src);
    console.log('  - Preview dimensions:', `${imagePreview.naturalWidth}x${imagePreview.naturalHeight}`);
  }
  
  if (removeButton) {
    console.log('  - Remove button is clickable:', !removeButton.disabled);
  }
  
  return {
    hasPreview: !!imagePreview,
    hasRemoveButton: !!removeButton,
    previewElement: imagePreview,
    removeElement: removeButton
  };
}

// Main test runner
async function runTiptapImageTests() {
  console.log('🚀 Starting Tiptap + Image Upload Integration Tests');
  console.log('=' .repeat(60));
  
  // Check if we're on the right page
  const isArticleForm = window.location.pathname.includes('/admin/articles');
  if (!isArticleForm) {
    console.log('⚠️ Navigate to /admin/articles/new or /admin/articles/[id]/edit first');
    return;
  }
  
  console.log('📍 Current page:', window.location.pathname);
  
  try {
    // Test 1: API Upload functionality
    const uploadResult = await testImageUploadAPI();
    
    // Test 2: File size validation
    await testOversizedImageUpload();
    
    // Test 3: File type validation
    await testInvalidFileTypeUpload();
    
    // Test 4: Editor presence and functionality
    const editorInfo = testTiptapEditorPresence();
    
    // Test 5: Image insertion (if we have a successful upload)
    if (uploadResult && editorInfo.hasEditor) {
      testEditorImageInsertion(uploadResult.url);
    }
    
    // Test 6: Content serialization
    testEditorContentSerialization();
    
    // Test 7: Image preview and removal
    testImagePreviewAndRemoval();
    
    // Test 8: URL validation
    testImageURLValidation();
    
    // Test 9: Cleanup on delete (manual test)
    await testImageCleanupOnDelete();
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Tiptap + Image Upload Tests Complete');
  console.log('\n📋 Manual Tests Still Needed:');
  console.log('1. Drag & drop image into editor');
  console.log('2. Paste image from clipboard');
  console.log('3. Edit article with existing images');
  console.log('4. Verify images persist after save/reload');
  console.log('5. Test image cleanup on article deletion');
}

// Utility functions for manual testing
window.tiptapImageTests = {
  runAll: runTiptapImageTests,
  testAPI: testImageUploadAPI,
  testEditor: testTiptapEditorPresence,
  testSerialization: testEditorContentSerialization,
  testPreview: testImagePreviewAndRemoval,
  createTestImage: createTestImageFile,
  insertTestImage: async () => {
    const result = await testImageUploadAPI();
    if (result) {
      testEditorImageInsertion(result.url);
    }
  }
};

// Instructions
console.log(`
📋 TIPTAP + IMAGE UPLOAD TESTING INSTRUCTIONS:

1. Navigate to /admin/articles/new or edit an existing article
2. Open browser developer tools (F12)
3. Run: runTiptapImageTests()

Or run individual tests:
- tiptapImageTests.testAPI() - Test upload API
- tiptapImageTests.testEditor() - Check editor presence
- tiptapImageTests.testSerialization() - Check content serialization
- tiptapImageTests.insertTestImage() - Upload and insert test image

🔍 MANUAL TESTING CHECKLIST:

Editor Functionality:
□ Editor loads without errors
□ Toolbar shows image button
□ Image button opens file picker
□ Drag & drop works
□ Paste from clipboard works

Upload Process:
□ File validation works (size, type)
□ Upload shows progress/loading state
□ Success shows image preview
□ Error handling works properly

Image Integration:
□ Images appear in editor correctly
□ Images are included in serialized content
□ Images persist after save/reload
□ Edit mode shows existing images

Cleanup:
□ Remove button works
□ Article deletion cleans up images (optional)
□ No orphaned images in Cloudinary
`);

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  console.log('🌐 Browser environment detected. Ready to run tests!');
  console.log('Run: runTiptapImageTests()');
}