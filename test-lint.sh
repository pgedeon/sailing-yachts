#!/bin/bash
echo "Checking for common syntax errors..."
npx tsc --noEmit 2>&1 | grep -i error || echo "✅ No TypeScript errors found"
echo "Checking file structure..."
if [ -d "app/api" ]; then
    echo "✅ API directory exists"
    if [ -f "app/api/manufacturers/route.ts" ]; then
        echo "✅ /api/manufacturers route exists"
    fi
    if [ -f "app/api/spec-categories/route.ts" ]; then
        echo "✅ /api/spec-categories route exists"
    fi
    if [ -f "app/api/yachts/route.ts" ]; then
        echo "✅ /api/yachts route exists"
    fi
fi
if [ -f "public/favicon.ico" ]; then
    echo "✅ Favicon exists in public directory"
else
    echo "❌ Favicon missing from public directory"
fi
echo "Checking database schema..."
if [ -f "drizzle/schema/manufacturers.ts" ]; then
    echo "✅ Manufacturers table schema exists"
fi
if [ -f "drizzle/schema/spec_categories.ts" ]; then
    echo "✅ Spec categories table schema exists"
fi
if [ -f "drizzle/schema/yachts.ts" ]; then
    echo "✅ Yachts table schema exists"
fi
echo "All checks completed!"
