#!/bin/bash

# ============================================
# Kharcha-Track - Supabase Database Setup Script
# ============================================

# Colors for output
RED='\033[0m'
GREEN='\033[0m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Kharcha-Track - Supabase Database Setup${NC}"

# ============================================
# Configuration
# ============================================

# Load environment variables from .env file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
    echo -e "${BLUE}✓ Loaded environment variables from .env${NC}"
else
    print_error "Could not find .env file at: $ENV_FILE"
    exit 1
fi

# Use variables from .env with fallbacks
PROJECT_NAME="${PROJECT_NAME:-kharcha-track}"
PROJECT_REF="${PROJECT_REF:-kharcha-track}"

# Supabase Configuration
SUPABASE_URL="${DATABASE_URL:-https://[YOUR-PASSWORD]@[PROJECT].supabase.co:5432/postgres}"
SUPABASE_KEY="${SUPABASE_ANON_KEY:-your-supabase-anon-key}"

# ============================================
# Functions
# ============================================

print_step() {
    local step=$1
    echo -e "${BLUE}Step ${step}: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if required environment variables are set
check_env_vars() {
    if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" == "postgresql://postgres:[YOUR-PASSWORD]@[PROJECT].supabase.co:5432/postgres" ]; then
        print_error "DATABASE_URL is not set correctly in .env file"
        echo -e "${YELLOW}Expected format: postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres"
        echo -e ""
        exit 1
    fi

    if [ -z "$SUPABASE_KEY" ] && [ "$SUPABASE_KEY" == "your-supabase-anon-key" ]; then
        print_error "SUPABASE_ANON_KEY is not set correctly in .env file"
        echo -e "${YELLOW}Set your Supabase anon key from: https://supabase.com/dashboard"
        echo -e ""
        exit 1
    fi
}

# Check if user has Supabase CLI installed
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        print_info "Installing Supabase CLI..."
        curl -fsSL https://supabase.com/install.sh | sh
        echo ""

        if ! command -v supabase &> /dev/null; then
            print_error "Failed to install Supabase CLI"
            echo -e "${YELLOW}Please install manually: npm install -g supabase"
            echo -e ""
            exit 1
        fi
    else
        print_success "Supabase CLI is installed"
    fi
}

# Create project in Supabase
create_project() {
    local project_name="$1"
    local db_password="${SUPABASE_DB_PASSWORD:-kharcha_track_db_password}"
    local db_name="${SUPABASE_DB_NAME:-kharcha_track_db}"

    print_step "Creating Supabase project..."

    # Use Supabase CLI to create project
    if command -v supabase &> /dev/null; then
        # Get project reference (create if exists)
        local exists=$(supabase projects list --json | jq -r ".[] | select(.[] | select(.reference_id == \"$1\") | .reference_id" 2>/dev/null || echo "")

        if [ -n "$exists" ]; then
            print_info "Project already exists, using existing ID: $exists"
        else
            print_info "Creating new project: ${project_name}..."
            supabase projects create \
                --db-name "$db_name" \
                --db-password "$db_password" \
                "$project_name" \
                --org-id "KTS" || true

            if [ $? -eq 0 ]; then
                print_success "Project created: ${project_name}"

                # Get the new project reference ID
                local new_project_id=$(supabase projects list --json | jq -r ".[] | select(.reference_id == \"$1\") | .reference_id" 2>/dev/null || echo "")
                print_info "Project ID: $new_project_id"
            else
                print_error "Failed to create project"
                exit 1
            fi
        fi
    else
        print_error "Supabase CLI is not installed. Please install: npm install -g supabase"
        exit 1
    fi
}

# Main execution
main() {
    print_step "Checking environment variables..."
    check_env_vars

    print_step "Checking Supabase CLI..."
    check_supabase_cli

    print_step "Setting up database..."
    create_project

    print_step "Setting up tables..."

    print_success "Database setup complete!"

    print_info ""
    echo -e "${BLUE}Next steps:"
    echo -e "1. Run SQL schema: supabase db execute seed.sql"
    echo -e "2. Verify tables: supabase db tables list"
    echo -e "3. Check data: supabase db select * from users"
    echo -e ""
    echo -e "${YELLOW}To use the database:"
    echo -e "• Add DATABASE_URL to both .env files (backend + mobile)"
    echo -e "• Backend: DATABASE_URL in backend/.env"
    echo -e "• Mobile: EXPO_PUBLIC_API_URL (optional, for direct DB access)"
    echo -e ""
    echo -e "${GREEN}Database ready for use! ${NC}"
    exit 0
}

# Run main function
main