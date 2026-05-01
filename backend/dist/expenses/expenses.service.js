"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const expense_entity_1 = require("../entities/expense.entity");
const category_entity_1 = require("../entities/category.entity");
let ExpensesService = class ExpensesService {
    constructor(expenseRepository, categoryRepository) {
        this.expenseRepository = expenseRepository;
        this.categoryRepository = categoryRepository;
    }
    async create(userId, amount, description, merchantName, date, categoryId, status = expense_entity_1.ExpenseStatus.CONFIRMED, accountSource, notes) {
        if (categoryId) {
            const category = await this.categoryRepository.findOne({
                where: { id: categoryId },
            });
            if (!category) {
                throw new common_1.NotFoundException('Category not found');
            }
        }
        const expense = this.expenseRepository.create({
            userId,
            amount,
            description,
            merchantName,
            date,
            categoryId,
            status,
            accountSource,
            notes,
        });
        return this.expenseRepository.save(expense);
    }
    async findAll(userId, status) {
        const query = this.expenseRepository
            .createQueryBuilder('expense')
            .leftJoinAndSelect('expense.category', 'category')
            .where('expense.userId = :userId', { userId });
        if (status) {
            query.andWhere('expense.status = :status', { status });
        }
        return query.orderBy('expense.createdAt', 'DESC').getMany();
    }
    async findAllAdmin(userId, status) {
        const query = this.expenseRepository
            .createQueryBuilder('expense')
            .leftJoinAndSelect('expense.category', 'category')
            .leftJoinAndSelect('expense.user', 'user')
            .orderBy('expense.createdAt', 'DESC');
        if (userId) {
            query.andWhere('expense.userId = :userId', { userId });
        }
        if (status) {
            query.andWhere('expense.status = :status', { status });
        }
        return query.getMany();
    }
    async findOne(id, userId) {
        const expense = await this.expenseRepository.findOne({
            where: { id, userId },
            relations: ['category'],
        });
        if (!expense) {
            throw new common_1.NotFoundException('Expense not found');
        }
        return expense;
    }
    async update(id, userId, updates) {
        const expense = await this.findOne(id, userId);
        if (updates.categoryId) {
            const category = await this.categoryRepository.findOne({
                where: { id: updates.categoryId },
            });
            if (!category) {
                throw new common_1.NotFoundException('Category not found');
            }
        }
        Object.assign(expense, updates);
        return this.expenseRepository.save(expense);
    }
    async confirm(id, userId) {
        const expense = await this.findOne(id, userId);
        if (expense.status === expense_entity_1.ExpenseStatus.CONFIRMED) {
            return expense;
        }
        expense.status = expense_entity_1.ExpenseStatus.CONFIRMED;
        if (expense.categoryId) {
            await this.updateBudgetSpent(userId, expense.categoryId, expense.amount);
        }
        return this.expenseRepository.save(expense);
    }
    async delete(id) {
        const expense = await this.expenseRepository.findOne({ where: { id } });
        if (!expense) {
            throw new common_1.NotFoundException('Expense not found');
        }
        await this.expenseRepository.remove(expense);
        return { message: 'Expense deleted successfully' };
    }
    async bulkConfirm(ids, userId) {
        const expenses = await this.expenseRepository
            .createQueryBuilder('expense')
            .where('expense.id IN (:...ids)', { ids })
            .andWhere('expense.userId = :userId', { userId })
            .andWhere('expense.status = :status', { status: expense_entity_1.ExpenseStatus.DRAFT })
            .getMany();
        for (const expense of expenses) {
            expense.status = expense_entity_1.ExpenseStatus.CONFIRMED;
            if (expense.categoryId) {
                await this.updateBudgetSpent(userId, expense.categoryId, expense.amount);
            }
        }
        await this.expenseRepository.save(expenses);
        return {
            confirmed: expenses.length,
            message: `${expenses.length} expense(s) confirmed`,
        };
    }
    async updateBudgetSpent(userId, categoryId, amount) {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
    }
};
exports.ExpensesService = ExpensesService;
exports.ExpensesService = ExpensesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(expense_entity_1.Expense)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ExpensesService);
//# sourceMappingURL=expenses.service.js.map