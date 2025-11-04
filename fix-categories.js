#!/usr/bin/env node

/**
 * Script to fix menu items with missing categories
 * This will set any menu items without categories to 'Mains' as a default
 */

const API_URL = 'http://localhost:5000/api';

async function fixCategories() {
  try {
    console.log('🔧 Fixing menu items with missing categories...\n');

    // First, we need to login to get a session
    console.log('Please make sure you are logged in to the application in your browser.');
    console.log('Then copy your session cookie value from the browser developer tools.');
    console.log('');
    console.log('To get the cookie:');
    console.log('1. Open your browser and log in to the application');
    console.log('2. Open Developer Tools (F12)');
    console.log('3. Go to Application/Storage → Cookies');
    console.log('4. Find the cookie named "connect.sid" and copy its value');
    console.log('');
    console.log('Once you have the cookie value, run:');
    console.log('');
    console.log('curl -X POST http://localhost:5000/api/maintenance/fix-menu-categories \\');
    console.log('  -H "Cookie: connect.sid=YOUR_COOKIE_VALUE_HERE" \\');
    console.log('  -H "Content-Type: application/json"');
    console.log('');
    console.log('This will fix any menu items without categories.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
fixCategories();