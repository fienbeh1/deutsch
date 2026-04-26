#!/bin/bash
# Convert PDFs to individual page PNG images for lighter web serving
# Usage: ./pdf_to_pages.sh [course_number]

COURSE_DIR="/home/f/deutsch/Deutsch als Fremdsprache"
OUTPUT_DIR="/home/f/deutsch/pages"

mkdir -p "$OUTPUT_DIR"

convert_pdf_pages() {
    local pdf_path="$1"
    local course_id="$2"
    local type="$3"
    
    if [ ! -f "$pdf_path" ]; then
        echo "PDF not found: $pdf_path"
        return
    fi
    
    local pages=$(pdfinfo "$pdf_path" 2>/dev/null | grep Pages | awk '{print $2}')
    local name=$(basename "$pdf_path" .pdf)
    local out_subdir="$OUTPUT_DIR/${course_id}_${type}"
    
    mkdir -p "$out_subdir"
    
    echo "Converting $name ($pages pages)..."
    
    # Convert all pages to PNG
    pdftoppm -png -r 150 "$pdf_path" "$out_subdir/page" &
    
    echo "  Output: $out_subdir/page-*.png"
}

if [ -n "$1" ]; then
    case $1 in
        1) convert_pdf_pages "$COURSE_DIR/Lagune 1-20230613T235903Z-001/Lagune 1/Kursbuch + CD/Lagune-1-Kursbuch.pdf" 1 "kb" ;;
        2) convert_pdf_pages "$COURSE_DIR/Lagune 2-20230613T235945Z-001/Lagune 2/Kursbuch + CD/Lagune-2-Kursbuch.pdf" 2 "kb" ;;
        4) convert_pdf_pages "$COURSE_DIR/Tangram Aktuell 1-20230614T003502Z-001/Tangram Aktuell 1/Tangram aktuell 1 Lektion 1-4 Kursbuch + Arbeitsbuch by Rosa-Maria Dallapiazza Til Schönherr Eduard von Jan (z-lib.org).pdf" 4 "kb1" ;;
        *) echo "Course not found" ;;
    esac
else
    # Convert all main PDFs
    echo "Converting all PDFs to pages..."
    convert_pdf_pages "$COURSE_DIR/Lagune 1-20230613T235903Z-001/Lagune 1/Kursbuch + CD/Lagune-1-Kursbuch.pdf" 1 "kb"
    convert_pdf_pages "$COURSE_DIR/Lagune 2-20230613T235945Z-001/Lagune 2/Kursbuch + CD/Lagune-2-Kursbuch.pdf" 2 "kb"
    convert_pdf_pages "$COURSE_DIR/Tangram Aktuell 1-20230614T003502Z-001/Tangram Aktuell 1/Tangram aktuell 1 Lektion 1-4 Kursbuch + Arbeitsbuch by Rosa-Maria Dallapiazza Til Schönherr Eduard von Jan (z-lib.org).pdf" 4 "kb1"
fi

echo "Done! Pages saved to $OUTPUT_DIR"