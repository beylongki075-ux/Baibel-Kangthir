/**
 * Bible Search System
 * Supports both keyword search and Bible reference format (e.g., "Mathiu 10:13-15")
 */

// Cache for loaded files
const fileCache = new Map();

// Book name mappings to file names
const bookMap = {
  'mathiu': 'Mathiu.html',
  'mark': 'Mark.html',
  'luk': 'Luk.html',
  'luke': 'Luk.html',
  'john': 'John.html',
  'phurkimo': 'Phurkimo.html',
  'sangho': 'Sangho.html',
  'jakob': 'Jakob.html',
  'james': 'Jakob.html',
  'pitor': 'Pitor.htm',
  'peter': 'Pitor.htm',
  'pitor2': 'Pitor2.html',
  'john1,2&3': 'John1,2&3.html',
  'jud': 'Jud.html',
  'jude': 'Jud.html',
  'aron': 'Aron.html',
  'rom': 'Rom.html',
  'romans': 'Rom.html',
  'korinth1': 'Korinth1.html',
  'korinth2': 'Korinth2.html',
  'galasia': 'Galasia.html',
  'ephesus': 'Ephesus.html',
  'philippi': 'Philippi.html',
  'kolose': 'Kolose.html',
  'thesalonika1': 'Thesalonika1.html',
  'thesalonika2': 'Thesalonika2.html',
  'timothi1': 'Timothi1.html',
  'timothi2': 'Timothi2.html',
  'titus': 'Titus.html',
  'philemon': 'Philemon.html',
  'hibru': 'Hibru.html',
  'kapeklang': 'Kapeklang.html'
};

// All searchable books
const allBooks = [
  'Aron.html','Ephesus.html','Galasia.html','Hibru.html','Jakob.html','John.html','John1,2&3.html',
  'Jud.html','Kapeklang.html','Kolose.html','Korinth1.html','Korinth2.html','Luk.html','Mark.html',
  'Mathiu.html','Philemon.html','Philippi.html','Phurkimo.html','Pitor.htm','Pitor2.html','Rom.html',
  'Sangho.html','Thesalonika1.html','Thesalonika2.html','Timothi1.html','Timothi2.html','Titus.html'
];

/**
 * Parse Bible reference format like "Mathiu 10:13-15" or "Mark 3:16-18"
 * Returns { file, chapter, verseStart, verseEnd, bookName } or null if not a valid reference
 */
function parseBibleReference(query) {
  // Match pattern: Book Chapter:VerseStart-VerseEnd or Book Chapter:Verse
  const refPattern = /^([a-zA-Z0-9,&\s]+?)\s+(\d+):(\d+)(?:-(\d+))?$/;
  const match = query.trim().match(refPattern);

  if (!match) return null;

  const bookInput = match[1].trim().toLowerCase();
  const chapter = match[2];
  const verseStart = match[3];
  const verseEnd = match[4] || match[3]; // If no end, use start

  // Look up the file in bookMap
  const fileName = bookMap[bookInput];
  if (!fileName) {
    console.warn('Book not found:', bookInput);
    return null;
  }

  // Extract the display name from the file name (e.g., "Mathiu.html" -> "Mathiu")
  const displayName = fileName.replace('.html', '').replace('.htm', '');

  return {
    file: fileName,
    bookName: displayName,
    chapter: chapter,
    verseStart: verseStart,
    verseEnd: verseEnd
  };
}

/**
 * Load and cache HTML file
 */
async function loadFile(fileName) {
  if (fileCache.has(fileName)) {
    return fileCache.get(fileName);
  }

  try {
    const response = await fetch(fileName);
    if (!response.ok) return null;
    const html = await response.text();
    fileCache.set(fileName, html);
    return html;
  } catch (error) {
    console.error(`Error loading ${fileName}:`, error);
    return null;
  }
}

/**
 * Parse HTML and extract verses
 * Returns array of { chapter, verse, text, pageIndex, fullHtml }
 */
function parseHtmlVerses(html, targetChapter = null) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const verses = [];

  const pages = doc.querySelectorAll('div.page');
  pages.forEach((page, pageIndex) => {
    const paragraphs = page.querySelectorAll('p');
    let currentChapter = null;

    paragraphs.forEach(para => {
      // Get the full inner HTML to parse manually
      let paraText = para.innerHTML || '';
      
      // First, extract chapter number from <b> tags anywhere in the paragraph
      const bTagsRegex = /<b[^>]*>([^<]*)<\/b>/g;
      let bMatch;
      while ((bMatch = bTagsRegex.exec(paraText)) !== null) {
        const bContent = bMatch[1].trim();
        // Match patterns like "1.", "2.", "3", etc (chapter indicators)
        const chapterMatch = bContent.match(/^(\d+)[\.\s]*$/);
        if (chapterMatch) {
          currentChapter = chapterMatch[1];
          break;
        }
      }

      // Skip if looking for specific chapter and don't have it
      if (targetChapter && currentChapter && currentChapter !== targetChapter) {
        return;
      }

      if (targetChapter && !currentChapter) {
        return;
      }

      // Now split by <br> tags and look for verses
      const lines = paraText.split(/<br\s*\/?>/gi);

      lines.forEach(line => {
        if (!line || line.trim().length === 0) return;

        // Remove HTML tags
        const cleaned = line.replace(/<[^>]*>/g, '').trim();
        if (!cleaned || cleaned.length === 0) return;

        // Look for verse markers: "1*", "2*", "17*", etc at the start
        const verseMatch = cleaned.match(/^(\d+)\*/);
        const verseNum = verseMatch ? verseMatch[1] : null;

        // Only include if we have both chapter and verse
        if (verseNum && currentChapter) {
          verses.push({
            chapter: String(currentChapter),
            verse: String(verseNum),
            text: cleaned,
            pageIndex: pageIndex,
            fullHtml: line
          });
        }
      });
    });
  });

  return verses;
}

/**
 * Highlight search term in text
 */
function highlightText(text, searchTerm) {
  if (!searchTerm) return escapeHtml(text);
  
  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
  return text
    .split(regex)
    .map(part => {
      if (part.toLowerCase() === searchTerm.toLowerCase()) {
        return `<span class="highlight">${escapeHtml(part)}</span>`;
      }
      return escapeHtml(part);
    })
    .join('');
}

/**
 * Escape regex special characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Perform search
 */
async function performSearch() {
  const query = document.getElementById('searchInput').value.trim();

  if (!query) {
    alert('Please enter a search query or Bible reference');
    return;
  }

  const resultsContainer = document.getElementById('resultsContainer');
  const resultsList = document.getElementById('resultsList');
  const resultsHeader = document.getElementById('resultsHeader');
  const loadingSpinner = document.getElementById('loadingSpinner');

  // Show loading
  resultsContainer.style.display = 'block';
  loadingSpinner.style.display = 'flex';
  resultsList.innerHTML = '';

  try {
    // Check if query is a Bible reference
    const refParsed = parseBibleReference(query);

    if (refParsed) {
      // Search by reference (Mathiu 10:13-15)
      await searchByReference(refParsed, resultsHeader, resultsList, loadingSpinner);
    } else {
      // Keyword search across all books
      await searchByKeyword(query, resultsHeader, resultsList, loadingSpinner);
    }
  } catch (error) {
    console.error('Search error:', error);
    loadingSpinner.style.display = 'none';
    resultsList.innerHTML = '<div style="color: #999; text-align: center; padding: 20px;">Error during search. Please try again.</div>';
  }
}

/**
 * Search by Bible reference (e.g., "Mathiu 10:13-15")
 */
async function searchByReference(ref, resultsHeader, resultsList, loadingSpinner) {
  const html = await loadFile(ref.file);
  
  if (!html) {
    loadingSpinner.style.display = 'none';
    resultsHeader.textContent = `Book "${ref.bookName}" not found`;
    resultsList.innerHTML = '<div style="color: #999; text-align: center; padding: 20px;">Could not find the specified book.</div>';
    return;
  }

  // Parse verses for the specific chapter
  const allVerses = parseHtmlVerses(html, ref.chapter);
  
  const verseStart = parseInt(ref.verseStart);
  const verseEnd = parseInt(ref.verseEnd);

  // Filter verses to those in the requested range
  const matching = allVerses.filter(v => {
    const vNum = parseInt(v.verse);
    return vNum >= verseStart && vNum <= verseEnd;
  });

  loadingSpinner.style.display = 'none';

  if (matching.length === 0) {
    resultsHeader.textContent = `No verses found for ${ref.bookName} ${ref.chapter}:${ref.verseStart}-${ref.verseEnd}`;
    resultsList.innerHTML = '<div style="color: #999; text-align: center; padding: 20px;">No matching verses.</div>';
    return;
  }

  resultsHeader.textContent = `Found ${matching.length} verse${matching.length !== 1 ? 's' : ''} for ${ref.bookName} ${ref.chapter}:${ref.verseStart}-${ref.verseEnd}`;

  matching.forEach((verse, idx) => {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.onclick = () => showVerseContent(ref.file, verse);

    item.innerHTML = `
      <div class="result-header">${ref.bookName} ${verse.chapter}:${verse.verse}</div>
      <div class="result-meta">📕 Chapter ${verse.chapter} · 📍 Verse ${verse.verse}</div>
      <div class="result-text">${escapeHtml(verse.text.substring(0, 250))}</div>
    `;

    resultsList.appendChild(item);
  });
}

/**
 * Search by keyword across all books
 */
async function searchByKeyword(query, resultsHeader, resultsList, loadingSpinner) {
  const results = [];

  // Search in all books
  for (const fileName of allBooks) {
    const html = await loadFile(fileName);
    if (!html) continue;

    const verses = parseHtmlVerses(html);
    
    verses.forEach(verse => {
      if (verse.text.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          file: fileName,
          bookName: fileName.replace('.html', '').replace('.htm', ''),
          ...verse,
          highlighted: highlightText(verse.text, query)
        });
      }
    });
  }

  loadingSpinner.style.display = 'none';

  if (results.length === 0) {
    resultsHeader.textContent = `No results found for "${query}"`;
    resultsList.innerHTML = '<div style="color: #999; text-align: center; padding: 20px;">No matching verses. Try different keywords.</div>';
    return;
  }

  resultsHeader.textContent = `Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`;

  results.forEach((result, idx) => {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.onclick = () => showVerseContent(result.file, result);

    item.innerHTML = `
      <div class="result-header">${result.bookName} ${result.chapter}:${result.verse}</div>
      <div class="result-meta">📕 Chapter ${result.chapter} · 📍 Verse ${result.verse}</div>
      <div class="result-text">${result.highlighted.substring(0, 250)}</div>
    `;

    resultsList.appendChild(item);
  });
}

/**
 * Show full chapter content in modal
 */
async function showVerseContent(fileName, verse) {
  const html = await loadFile(fileName);
  if (!html) {
    alert('Could not load chapter content');
    return;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const pages = doc.querySelectorAll('div.page');

  if (pages[verse.pageIndex]) {
    const page = pages[verse.pageIndex];
    const modal = document.getElementById('verseModal');
    const title = document.getElementById('verseTitle');
    const content = document.getElementById('verseContent');

    const bookName = fileName.replace('.html', '').replace('.htm', '');
    title.textContent = `${bookName} - Chapter ${verse.chapter}`;

    // Build chapter content with all verses
    let chapterContent = '';
    const paras = page.querySelectorAll('p');
    paras.forEach(para => {
      const inner = para.innerHTML || '';
      // Add paragraphs with preserved formatting
      chapterContent += `<div style="margin-bottom: 15px;">${inner}</div>`;
    });

    content.innerHTML = chapterContent;

    modal.classList.add('active');
    modal.scrollTop = 0;
  }
}

/**
 * Close verse modal
 */
function closeVerseModal() {
  document.getElementById('verseModal').classList.remove('active');
}

/**
 * Clear search
 */
function clearSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('resultsContainer').style.display = 'none';
  document.getElementById('resultsList').innerHTML = '';
  document.getElementById('resultsHeader').textContent = '';
  closeVerseModal();
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    // Enter key to search
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }

  // Close modal on click outside
  const modal = document.getElementById('verseModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeVerseModal();
      }
    });
  }
});
