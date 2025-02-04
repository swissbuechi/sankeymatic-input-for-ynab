<template>
    <div>
        <h2>Select a Budget</h2>
        <select :value="budgetId" @change="onSelectBudget">
            <option v-for="budget in budgets" :key="budget.id" :value="budget.id">
                {{ budget.name }}
            </option>
            <option v-if="budgets.length === 0" disabled>No budgets available</option>
        </select>
    </div>
</template>

<script>
export default {
    props: {
        api: Object,
        budgetId: String
    },
    data() {
        return {
            budgets: [],
        };
    },
    created() {
        this.getBudgets();
    },
    methods: {
        async getBudgets() {
            try {
                const res = await this.api.budgets.getBudgets();
                this.budgets = res.data.budgets;
            } catch (err) {
                console.error("Failed to fetch budgets:", err);
            }
        },
        onSelectBudget(event) {
            this.$emit('update:budgetId', event.target.value);
        }
    }
};
</script>