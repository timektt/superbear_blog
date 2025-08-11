/**
 * Browser-based Article CRUD Testing Script
 * Run this in the browser console while logged in as admin
 */

// Test data
const testArticle = {
  title: 'Test Article for CRUD Operations',
  slug: 'test-article-crud-operations',
  summary: 'This is a test article to verify CRUD operations work correctly.',
  content: JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'This is test content for the CRUD operations test.',
          },
        ],
      },
    ],
  }),
  status: 'DRAFT',
  authorId: '', // Will be set dynamically
  categoryId: '', // Will be set dynamically
  tagIds: [],
};

// Helper function to make authenticated requests
async function makeAuthenticatedRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
      ...options,
    });

    const data = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      data,
      response,
    };
  } catch (error) {
    console.error(`Request failed for ${url}:`, error);
    return {
      ok: false,
      status: 0,
      data: null,
      error: error.message,
    };
  }
}

// Test functions
async function testFormOptions() {
  console.log('🔍 Testing form options...');

  const [authorsResult, categoriesResult, tagsResult] = await Promise.all([
    makeAuthenticatedRequest('/api/admin/authors'),
    makeAuthenticatedRequest('/api/admin/categories'),
    makeAuthenticatedRequest('/api/admin/tags'),
  ]);

  console.log(
    'Authors API:',
    authorsResult.ok ? '✅ Success' : `❌ Failed (${authorsResult.status})`
  );
  console.log(
    'Categories API:',
    categoriesResult.ok
      ? '✅ Success'
      : `❌ Failed (${categoriesResult.status})`
  );
  console.log(
    'Tags API:',
    tagsResult.ok ? '✅ Success' : `❌ Failed (${tagsResult.status})`
  );

  if (authorsResult.ok && authorsResult.data.authors?.length > 0) {
    testArticle.authorId = authorsResult.data.authors[0].id;
    console.log(`Using author: ${authorsResult.data.authors[0].name}`);
  }

  if (categoriesResult.ok && categoriesResult.data.categories?.length > 0) {
    testArticle.categoryId = categoriesResult.data.categories[0].id;
    console.log(`Using category: ${categoriesResult.data.categories[0].name}`);
  }

  if (tagsResult.ok && tagsResult.data.tags?.length > 0) {
    testArticle.tagIds = [tagsResult.data.tags[0].id];
    console.log(`Using tag: ${tagsResult.data.tags[0].name}`);
  }

  return testArticle.authorId && testArticle.categoryId;
}

async function testCreateArticle() {
  console.log('📝 Testing article creation...');

  const result = await makeAuthenticatedRequest('/api/admin/articles', {
    method: 'POST',
    body: JSON.stringify(testArticle),
  });

  if (result.ok) {
    console.log('✅ Article created successfully');
    console.log('Article ID:', result.data.id);
    console.log('Article Slug:', result.data.slug);
    return result.data;
  } else {
    console.log('❌ Article creation failed');
    console.log('Error:', result.data?.message || result.error);
    return null;
  }
}

async function testValidationErrors() {
  console.log('🚫 Testing validation errors...');

  const invalidArticle = {
    title: '', // Empty title
    content: '', // Empty content
  };

  const result = await makeAuthenticatedRequest('/api/admin/articles', {
    method: 'POST',
    body: JSON.stringify(invalidArticle),
  });

  if (!result.ok && result.status === 400) {
    console.log('✅ Validation errors handled correctly');
    console.log('Error message:', result.data?.message);
    return true;
  } else {
    console.log('❌ Validation test failed');
    return false;
  }
}

async function testUpdateArticle(articleId) {
  console.log('✏️ Testing article update...');

  const updateData = {
    title: 'Updated Test Article',
    status: 'PUBLISHED',
  };

  const result = await makeAuthenticatedRequest(
    `/api/admin/articles/${articleId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    }
  );

  if (result.ok) {
    console.log('✅ Article updated successfully');
    console.log('New title:', result.data.title);
    console.log('New status:', result.data.status);
    return result.data;
  } else {
    console.log('❌ Article update failed');
    console.log('Error:', result.data?.message || result.error);
    return null;
  }
}

async function testDeleteArticle(articleId) {
  console.log('🗑️ Testing article deletion...');

  const result = await makeAuthenticatedRequest(
    `/api/admin/articles/${articleId}`,
    {
      method: 'DELETE',
    }
  );

  if (result.ok) {
    console.log('✅ Article deleted successfully');
    return true;
  } else {
    console.log('❌ Article deletion failed');
    console.log('Error:', result.data?.message || result.error);
    return false;
  }
}

async function testSlugGeneration() {
  console.log('🔗 Testing slug generation...');

  const articleWithSpecialChars = {
    ...testArticle,
    title: 'Test Article With Special Characters!!! @#$%',
    slug: undefined, // Let backend generate
  };

  const result = await makeAuthenticatedRequest('/api/admin/articles', {
    method: 'POST',
    body: JSON.stringify(articleWithSpecialChars),
  });

  if (result.ok) {
    console.log('✅ Slug generation works');
    console.log(`Title: "${articleWithSpecialChars.title}"`);
    console.log(`Generated slug: "${result.data.slug}"`);

    // Clean up
    await makeAuthenticatedRequest(`/api/admin/articles/${result.data.id}`, {
      method: 'DELETE',
    });

    return result.data;
  } else {
    console.log('❌ Slug generation test failed');
    console.log('Error:', result.data?.message || result.error);
    return null;
  }
}

async function testDuplicateSlug() {
  console.log('🔄 Testing duplicate slug handling...');

  // First, create an article
  const firstArticle = await makeAuthenticatedRequest('/api/admin/articles', {
    method: 'POST',
    body: JSON.stringify({
      ...testArticle,
      title: 'First Article',
      slug: 'duplicate-test-slug',
    }),
  });

  if (!firstArticle.ok) {
    console.log('❌ Failed to create first article for duplicate test');
    return false;
  }

  // Try to create another with same slug
  const duplicateArticle = await makeAuthenticatedRequest(
    '/api/admin/articles',
    {
      method: 'POST',
      body: JSON.stringify({
        ...testArticle,
        title: 'Second Article',
        slug: 'duplicate-test-slug', // Same slug
      }),
    }
  );

  if (duplicateArticle.ok) {
    console.log('✅ Duplicate slug handled correctly');
    console.log(`Original slug: duplicate-test-slug`);
    console.log(`New slug: ${duplicateArticle.data.slug}`);

    // Clean up both articles
    await makeAuthenticatedRequest(
      `/api/admin/articles/${firstArticle.data.id}`,
      {
        method: 'DELETE',
      }
    );
    await makeAuthenticatedRequest(
      `/api/admin/articles/${duplicateArticle.data.id}`,
      {
        method: 'DELETE',
      }
    );

    return true;
  } else {
    console.log('❌ Duplicate slug test failed');
    console.log(
      'Error:',
      duplicateArticle.data?.message || duplicateArticle.error
    );

    // Clean up first article
    await makeAuthenticatedRequest(
      `/api/admin/articles/${firstArticle.data.id}`,
      {
        method: 'DELETE',
      }
    );

    return false;
  }
}

// Main test runner
async function runBrowserTests() {
  console.log('🚀 Starting Browser-based Article CRUD Tests');
  console.log('='.repeat(50));

  try {
    // Check if we can access form options (indicates we're authenticated)
    const hasFormOptions = await testFormOptions();

    if (!hasFormOptions) {
      console.log(
        '❌ Cannot proceed - missing form options or not authenticated'
      );
      console.log(
        'Please ensure you are logged in as admin and have authors/categories in the database'
      );
      return;
    }

    // Test validation errors first (doesn't create data)
    await testValidationErrors();

    // Test slug generation
    await testSlugGeneration();

    // Test duplicate slug handling
    await testDuplicateSlug();

    // Test full CRUD cycle
    console.log('\n🔄 Testing full CRUD cycle...');
    const createdArticle = await testCreateArticle();

    if (createdArticle) {
      await testUpdateArticle(createdArticle.id);
      await testDeleteArticle(createdArticle.id);
    }
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Browser tests complete');
}

// Instructions for manual testing
console.log(`
📋 MANUAL TESTING INSTRUCTIONS:

1. Open browser and navigate to your admin panel
2. Login as admin user
3. Open browser developer tools (F12)
4. Copy and paste this entire script into the console
5. Run: runBrowserTests()

Or run individual tests:
- testFormOptions()
- testCreateArticle()
- testValidationErrors()
- testUpdateArticle(articleId)
- testDeleteArticle(articleId)
- testSlugGeneration()
- testDuplicateSlug()

🔍 FORM TESTING CHECKLIST:

Frontend Form Tests (manual):
1. Go to /admin/articles/new
2. Try submitting empty form → should show validation errors
3. Fill title → slug should auto-generate
4. Edit slug to invalid format → should show error
5. Fill all required fields → submit button should enable
6. Submit form → should show success toast and redirect

Table Tests (manual):
1. Go to /admin/articles
2. Test filters (status, category, author)
3. Test pagination if you have many articles
4. Click "Edit" → should open edit form with pre-filled data
5. Click "Delete" → should show confirmation modal
6. Confirm delete → should show success toast and remove from table
`);

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  console.log('🌐 Browser environment detected. Ready to run tests!');
  console.log('Run: runBrowserTests()');
}
