/**
 * Comprehensive Article CRUD Testing Script
 * Tests all aspects of article creation, reading, updating, and deletion
 */

const BASE_URL = 'http://localhost:3000';

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

const testArticleUpdate = {
  title: 'Updated Test Article for CRUD Operations',
  summary: 'This article has been updated to test PATCH operations.',
  status: 'PUBLISHED',
};

// Helper function to make API requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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
async function testGetFormOptions() {
  console.log('\n🔍 Testing form options (authors, categories, tags)...');

  const [authorsResult, categoriesResult, tagsResult] = await Promise.all([
    makeRequest(`${BASE_URL}/api/admin/authors`),
    makeRequest(`${BASE_URL}/api/admin/categories`),
    makeRequest(`${BASE_URL}/api/admin/tags`),
  ]);

  console.log(
    'Authors API:',
    authorsResult.ok ? '✅ Success' : `❌ Failed (${authorsResult.status})`
  );
  if (authorsResult.ok && authorsResult.data.authors?.length > 0) {
    testArticle.authorId = authorsResult.data.authors[0].id;
    console.log(`  - Using author: ${authorsResult.data.authors[0].name}`);
  } else {
    console.log('  - ⚠️ No authors available');
  }

  console.log(
    'Categories API:',
    categoriesResult.ok
      ? '✅ Success'
      : `❌ Failed (${categoriesResult.status})`
  );
  if (categoriesResult.ok && categoriesResult.data.categories?.length > 0) {
    testArticle.categoryId = categoriesResult.data.categories[0].id;
    console.log(
      `  - Using category: ${categoriesResult.data.categories[0].name}`
    );
  } else {
    console.log('  - ⚠️ No categories available');
  }

  console.log(
    'Tags API:',
    tagsResult.ok ? '✅ Success' : `❌ Failed (${tagsResult.status})`
  );
  if (tagsResult.ok && tagsResult.data.tags?.length > 0) {
    testArticle.tagIds = [tagsResult.data.tags[0].id];
    console.log(`  - Using tag: ${tagsResult.data.tags[0].name}`);
  } else {
    console.log('  - ⚠️ No tags available');
  }

  return {
    authors: authorsResult,
    categories: categoriesResult,
    tags: tagsResult,
  };
}

async function testCreateArticle() {
  console.log('\n📝 Testing article creation (POST /api/admin/articles)...');

  const result = await makeRequest(`${BASE_URL}/api/admin/articles`, {
    method: 'POST',
    body: JSON.stringify(testArticle),
  });

  if (result.ok) {
    console.log('✅ Article created successfully');
    console.log(`  - ID: ${result.data.id}`);
    console.log(`  - Title: ${result.data.title}`);
    console.log(`  - Slug: ${result.data.slug}`);
    console.log(`  - Status: ${result.data.status}`);
    return result.data;
  } else {
    console.log(`❌ Article creation failed (${result.status})`);
    console.log(`  - Error: ${result.data?.message || result.error}`);
    if (result.data?.issues) {
      result.data.issues.forEach((issue) => {
        console.log(
          `  - Validation: ${issue.path?.join('.')} - ${issue.message}`
        );
      });
    }
    return null;
  }
}

async function testCreateDuplicateSlug() {
  console.log('\n🔄 Testing duplicate slug handling...');

  const duplicateArticle = {
    ...testArticle,
    title: 'Another Test Article',
    slug: testArticle.slug, // Same slug
  };

  const result = await makeRequest(`${BASE_URL}/api/admin/articles`, {
    method: 'POST',
    body: JSON.stringify(duplicateArticle),
  });

  if (result.ok) {
    console.log('✅ Duplicate slug handled correctly');
    console.log(`  - Original slug: ${testArticle.slug}`);
    console.log(`  - New slug: ${result.data.slug}`);
    return result.data;
  } else {
    console.log(`❌ Duplicate slug test failed (${result.status})`);
    console.log(`  - Error: ${result.data?.message || result.error}`);
    return null;
  }
}

async function testGetArticles() {
  console.log('\n📋 Testing article listing (GET /api/admin/articles)...');

  const result = await makeRequest(`${BASE_URL}/api/admin/articles`);

  if (result.ok) {
    console.log('✅ Articles retrieved successfully');
    console.log(`  - Total articles: ${result.data.articles?.length || 0}`);
    console.log(
      `  - Pagination: Page ${result.data.pagination?.page} of ${result.data.pagination?.pages}`
    );
    return result.data;
  } else {
    console.log(`❌ Article listing failed (${result.status})`);
    console.log(`  - Error: ${result.data?.message || result.error}`);
    return null;
  }
}

async function testUpdateArticle(articleId) {
  console.log(
    `\n✏️ Testing article update (PATCH /api/admin/articles/${articleId})...`
  );

  const result = await makeRequest(
    `${BASE_URL}/api/admin/articles/${articleId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(testArticleUpdate),
    }
  );

  if (result.ok) {
    console.log('✅ Article updated successfully');
    console.log(`  - Title: ${result.data.title}`);
    console.log(`  - Status: ${result.data.status}`);
    console.log(`  - Published: ${result.data.publishedAt ? 'Yes' : 'No'}`);
    return result.data;
  } else {
    console.log(`❌ Article update failed (${result.status})`);
    console.log(`  - Error: ${result.data?.message || result.error}`);
    return null;
  }
}

async function testDeleteArticle(articleId) {
  console.log(
    `\n🗑️ Testing article deletion (DELETE /api/admin/articles/${articleId})...`
  );

  const result = await makeRequest(
    `${BASE_URL}/api/admin/articles/${articleId}`,
    {
      method: 'DELETE',
    }
  );

  if (result.ok) {
    console.log('✅ Article deleted successfully');
    return true;
  } else {
    console.log(`❌ Article deletion failed (${result.status})`);
    console.log(`  - Error: ${result.data?.message || result.error}`);
    return false;
  }
}

async function testValidationErrors() {
  console.log('\n🚫 Testing validation errors...');

  const invalidArticle = {
    title: '', // Empty title
    content: '', // Empty content
    // Missing required fields
  };

  const result = await makeRequest(`${BASE_URL}/api/admin/articles`, {
    method: 'POST',
    body: JSON.stringify(invalidArticle),
  });

  if (!result.ok && result.status === 400) {
    console.log('✅ Validation errors handled correctly');
    console.log(`  - Status: ${result.status}`);
    console.log(`  - Error: ${result.data?.message || result.error}`);
    return true;
  } else {
    console.log(
      `❌ Validation test failed - expected 400, got ${result.status}`
    );
    return false;
  }
}

async function testSlugGeneration() {
  console.log('\n🔗 Testing slug generation...');

  const articleWithoutSlug = {
    ...testArticle,
    title: 'Test Article Without Slug!!! @#$%',
    slug: undefined, // No slug provided
  };

  const result = await makeRequest(`${BASE_URL}/api/admin/articles`, {
    method: 'POST',
    body: JSON.stringify(articleWithoutSlug),
  });

  if (result.ok) {
    console.log('✅ Slug generation works correctly');
    console.log(`  - Title: "${articleWithoutSlug.title}"`);
    console.log(`  - Generated slug: "${result.data.slug}"`);

    // Clean up
    await makeRequest(`${BASE_URL}/api/admin/articles/${result.data.id}`, {
      method: 'DELETE',
    });

    return result.data;
  } else {
    console.log(`❌ Slug generation test failed (${result.status})`);
    console.log(`  - Error: ${result.data?.message || result.error}`);
    return null;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Article CRUD Operations Test Suite');
  console.log('='.repeat(60));

  let createdArticleId = null;
  let duplicateArticleId = null;

  try {
    // Test 1: Get form options
    const formOptions = await testGetFormOptions();

    if (!testArticle.authorId || !testArticle.categoryId) {
      console.log(
        '\n❌ Cannot proceed with tests - missing required form options'
      );
      console.log(
        'Please ensure you have at least one author and one category in the database'
      );
      return;
    }

    // Test 2: Create article
    const createdArticle = await testCreateArticle();
    if (createdArticle) {
      createdArticleId = createdArticle.id;
    }

    // Test 3: Test duplicate slug handling
    const duplicateArticle = await testCreateDuplicateSlug();
    if (duplicateArticle) {
      duplicateArticleId = duplicateArticle.id;
    }

    // Test 4: Get articles
    await testGetArticles();

    // Test 5: Update article
    if (createdArticleId) {
      await testUpdateArticle(createdArticleId);
    }

    // Test 6: Test validation errors
    await testValidationErrors();

    // Test 7: Test slug generation
    await testSlugGeneration();

    // Test 8: Delete articles (cleanup)
    if (createdArticleId) {
      await testDeleteArticle(createdArticleId);
    }
    if (duplicateArticleId) {
      await testDeleteArticle(duplicateArticleId);
    }
  } catch (error) {
    console.error('\n💥 Test suite failed with error:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Article CRUD Operations Test Suite Complete');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testGetFormOptions,
  testCreateArticle,
  testGetArticles,
  testUpdateArticle,
  testDeleteArticle,
  testValidationErrors,
  testSlugGeneration,
};
