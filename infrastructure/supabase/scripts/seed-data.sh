#!/bin/bash

# ============================================
# Kharcha-Track - Supabase Data Seeding Script
# ============================================

# Colors for output
RED='\033[0m'
GREEN='\033[0m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Kharcha-Track - Supabase Data Seeding${NC}"

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
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-your-supabase-anon-key}"

# ============================================
# Helper Functions
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

log_and_execute() {
    local sql="$1"
    echo -e "${BLUE}Executing SQL: $sql${NC}"

    # Execute via psql or supabase
    if command -v psql &> /dev/null; then
        psql "$SUPABASE_URL" -c "$sql" -t
        local result=$?
        if [ $result -eq 0 ]; then
            echo -e "${GREEN}✅ Executed successfully${NC}"
            return 0
        else
            echo -e "${RED}✗ Failed to execute${NC}"
            return 1
        fi
    elif command -v supabase &> /dev/null; then
        # Use Supabase CLI
        echo -e "${YELLOW}Using Supabase CLI...${NC}"
        local output=$(supabase db execute -c "$sql" --project "$PROJECT_REF" 2>&1 | head -20)

        if echo "$output" | grep -qi -E "SUCCESS"; then
            echo -e "${GREEN}✅ SQL executed successfully${NC}"
            return 0
        else
            echo -e "${RED}✗ Failed to execute SQL${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ psql or supabase CLI not available${NC}"
        echo -e "${YELLOW}Please install one of them${NC}"
        return 1
    fi
}

create_sample_user() {
    local email="demo@kharcha-track.com"
    local full_name="Demo User"
    local password_hash=$(openssl rand -base64 32 | openssl rand -base64 32 | tr -d '\n')

    print_step "Creating sample user..."

    local insert_user_sql="INSERT INTO users (id, email, password_hash, full_name, created_at, updated_at)
    VALUES (
        uuid_generate_v4(),
        '$email',
        '$password_hash',
        '$full_name',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ) ON CONFLICT DO NOTHING;"

    log_and_execute "$insert_user_sql"

    if [ $? -eq 0 ]; then
        print_success "Sample user created"
    else
        print_error "Failed to create sample user"
        return 1
    fi
}

create_sample_categories() {
    print_step "Creating sample categories..."

    local insert_categories_sql="
INSERT INTO categories (name, color, icon, user_id)
    VALUES
        ('Food & Dining', '#FF6B6B', '🍔', NULL),
        ('Transportation', '#4ECDC4', '🚗', NULL),
        ('Shopping', '#45B7D1', '🛍️', NULL),
        ('Entertainment', '#FFA07A', '🎬', NULL),
        ('Bills & Utilities', '#98D8C8', '💡', NULL),
        ('Healthcare', '#F7DC6F', '🏥', NULL)
    ON CONFLICT DO NOTHING;"

    log_and_execute "$insert_categories_sql"

    if [ $? -eq 0 ]; then
        print_success "Sample categories created"
    else
        print_error "Failed to create sample categories"
        return 1
    fi
}

create_sample_expenses() {
    print_step "Creating sample expenses..."

    # Get a sample user ID (first user from insert)
    local user_id=$(log_and_execute "SELECT id FROM users LIMIT 1" 2>/dev/null || echo "")

    if [ -z "$user_id" ]; then
        print_error "No users found in database. Cannot create sample expenses"
        return 1
    fi

    local sample_expenses_sql="
INSERT INTO expenses (id, amount, description, merchant_name, date, status, category_id, user_id, created_at, updated_at)
    VALUES
        (uuid_generate_v4(), 25.00, 'Starbucks Coffee', 'Starbucks', CURRENT_DATE, 'draft', NULL, '$user_id', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (uuid_generate_v4(), 15.50, 'Amazon AWS Bill', 'Amazon AWS', CURRENT_DATE, 'draft', NULL, '$user_id', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (uuid_generate_v4(), 45.75, 'Grocery Store', 'Whole Foods', CURRENT_DATE, 'draft', NULL, '$user_id', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (uuid_generate_v4(), 12.99, 'Uber Ride', 'Uber', CURRENT_DATE, 'draft', NULL, '$user_id', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (uuid_generate_v4(), 8.50, 'Local Restaurant', 'Local Cafe', CURRENT_DATE, 'draft', NULL, '$user_id', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);"

    log_and_execute "$sample_expenses_sql"

    if [ $? -eq 0 ]; then
        print_success "Sample expenses created"
    else
        print_error "Failed to create sample expenses"
        return 1
    fi
}

create_sample_budgets() {
    print_step "Creating sample budgets..."

    # Get a sample user ID (first user from insert)
    local user_id=$(log_and_execute "SELECT id FROM users LIMIT 1" 2>/dev/null || echo "")

    if [ -z "$user_id" ]; then
        print_error "No users found in database. Cannot create sample budgets"
        return 1
    fi

    local current_month=$(date +%Y-%m)
    local current_year=$(date +%Y)

    local sample_budgets_sql="
INSERT INTO budgets (id, limit, spent, month, year, user_id, created_at, updated_at)
    VALUES
        (uuid_generate_v4(), 500.00, 0.00, $current_month, $current_year, '$user_id', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (uuid_generate_v4(), 200.00, 0.00, $current_month, $current_year, '$user_id', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);"

    log_and_execute "$sample_budgets_sql"

    if [ $? -eq 0 ]; then
        print_success "Sample budgets created"
    else
        print_error "Failed to create sample budgets"
        return 1
    fi
}

# Display menu
show_menu() {
    echo -e ""
    echo -e "${BLUE}===========================================${NC}"
    echo -e "  ${BLUE}Kharcha-Track - Data Seeding Options${NC}"
    echo -e "===========================================${NC}"
    echo -e "1) Create all sample data (users, categories, expenses, budgets)"
    echo -e "2) Create sample categories only"
    echo -e "3) Create sample expenses only"
    echo -e "4) Create sample budgets only"
    echo -e "5) Reset database and reseed from scratch"
    echo -e "6) Display database statistics"
    echo -e "7) Exit"
    echo -e ""
}

# ============================================
# Main Execution
# ============================================

main() {
    # Check environment variables
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not set"
        echo -e "${YELLOW}Please set DATABASE_URL in .env file${NC}"
        echo -e "Format: postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres${NC}"
        exit 1
    fi

    # Show menu
    show_menu

    # Get user selection
    local choice
    read -p "Enter your choice (1-7): " choice

    case $choice in
        1)
            echo -e "${GREEN}Creating all sample data...${NC}"
            create_sample_user
            create_sample_categories
            create_sample_expenses
            create_sample_budgets
            print_success "All sample data created successfully!"
            echo -e ""
            echo -e "${BLUE}Database now populated with:"
            echo -e "• 1 user (Demo User)"
            echo -e "• 5 categories (Food, Transport, Shopping, etc.)"
            echo -e "• 5 expenses (Coffee, Amazon, Grocery, etc.)"
            echo -e "• 1 budget (Monthly, $500 limit)"
            echo -e ""
            echo -e "${GREEN}You can now:"
            echo -e "• Start backend: cd backend && npm run start:dev"
            echo -e "• Test API: Test endpoints and database connection"
            echo -e "• Start mobile: cd mobile && npx expo start"
            echo -e "• Run scripts: ./infrastructure/supabase/scripts/setup-supabase.sh or ./infrastructure/supabase/scripts/seed-data.sh"
            ;;

        2)
            echo -e "${GREEN}Creating sample categories only...${NC}"
            create_sample_categories
            print_success "Categories seeded!"
            echo -e "${BLUE}Database now has categories to use${NC}"
            ;;

        3)
            echo -e "${GREEN}Creating sample expenses only...${NC}"
            create_sample_expenses
            print_success "Expenses seeded!"
            echo -e "${BLUE}Database now has expenses to test${NC}"
            ;;

        4)
            echo -e "${GREEN}Creating sample budgets only...${NC}"
            create_sample_budgets
            print_success "Budgets seeded!"
            echo -e "${BLUE}Database now has budgets to track${NC}"
            ;;

        5)
            echo -e "${GREEN}Resetting database...${NC}"
            local reset_sql="
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
"
            log_and_execute "$reset_sql"

            if [ $? -eq 0 ]; then
                print_success "Database reset successfully!"
                echo -e "${BLUE}Database is now clean (empty)${NC}"
                echo -e "${YELLOW}Warning: All data deleted permanently${NC}"
            else
                print_error "Failed to reset database"
                exit 1
            fi
            ;;

        6)
            echo -e "${GREEN}Showing database statistics...${NC}"
            local stats_sql="
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'expenses' as table_name, COUNT(*) as count FROM expenses
UNION ALL
SELECT 'budgets' as table_name, COUNT(*) as count FROM budgets"

            echo -e ""
            log_and_execute "$stats_sql"

            echo -e ""
            print_success "Database statistics displayed above"
            ;;

        7)
            echo -e "${GREEN}Exiting...${NC}"
            exit 0
            ;;

        *)
            echo -e "${RED}Invalid choice. Please try again.${NC}"
            echo -e ""
            ;;
    esac
}

# Run main function
main