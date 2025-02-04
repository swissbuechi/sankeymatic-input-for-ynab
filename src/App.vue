<template>
  <div id="app">
    <Nav />
    <div class="container">
      <p v-if="loading" class="display-4">Loading...</p>

      <div v-if="error">
        <h1 class="display-4">Oops!</h1>
        <p class="lead">{{ error }}</p>
        <button class="btn btn-primary" @click="resetToken">
          Try Again &gt;
        </button>
      </div>

      <div v-else>
        <form v-if="!ynab.token">
          <h1 class="display-4">Authorize YNAB</h1>
          <p class="lead">
            Authorize this app with YNAB to generate an input config for
            <a href="https://sankeymatic.com/build/" target="_blank" rel="noopener noreferrer">SankeyMATIC</a>.
          </p>
          <button @click="authorizeWithYNAB" class="btn btn-primary">
            Authorize This App With YNAB &gt;
          </button>
        </form>

        <div v-else>

          <h2>Select a Budget</h2>
          <select v-model="budgetId" @change="selectBudget">
            <option v-for="budget in budgets" :key="budget.id" :value="budget.id">
              {{ budget.name }}
            </option>
            <option v-if="budgets.length === 0" disabled>No budgets available</option>
          </select>

          <h2>Select a Month</h2>
          <select v-model="selectedMonth" @change="selectMonth">
            <option v-for="month in months" :key="month.month" :value="month.month">
              {{ month.name }}
            </option>
            <option v-if="months.length === 0" disabled>
              No months available
            </option>
          </select>

          <SankeyMATIC :budgetMonthCategories="budgetMonthCategories" />

        </div>
        <Footer />
      </div>
    </div>
  </div>
</template>

<script>
import * as ynab from "ynab";
import Nav from "./components/Nav.vue";
import Footer from "./components/Footer.vue";
import SankeyMATIC from "./components/SankeyMATIC.vue"

export default {
  components: {
    Nav,
    Footer,
    SankeyMATIC,
  },
  data() {
    return {
      ynab: {
        clientId: import.meta.env.VITE_CLIENT_ID,
        redirectUri: import.meta.env.VITE_REDIRECT_URI,
        token: null,
        api: null,
      },
      loading: false,
      error: null,
      budgetId: null,
      budgets: [],
      months: [],
      selectedMonth: "current",
      budgetMonthCategories: []
    };
  },
  created() {
    this.ynab.token = this.findYNABToken();
    if (this.ynab.token) {
      this.api = new ynab.API(this.ynab.token);
      this.getBudgets();
    }
  },
  methods: {
    async getBudgets() {
      this.loading = true;
      try {
        const res = await this.api.budgets.getBudgets();
        this.budgets = res.data.budgets;
      } catch (err) {
        this.error = err.error.detail || "Failed to fetch budgets";
      } finally {
        this.loading = false;
      }
    },
    async selectBudget() {
      if (!this.budgetId) return;

      this.loading = true;

      try {
        const { data: monthsData } = await this.api.months.getBudgetMonths(this.budgetId);

        this.months = monthsData.months.map((month) => ({
          month: month.month,
          name: new Date(month.month).toLocaleString("default", { month: "long", year: "numeric" }),
        }));

        this.selectedMonth = this.months[0]?.month || null;

        if (this.selectedMonth) {
          this.selectMonth();
        }
      } catch (err) {
        this.error = err.error.detail || "Failed to fetch budget details";
      } finally {
        this.loading = false;
      }
    },
    async selectMonth() {
      if (!this.selectedMonth || !this.budgetId) return;

      this.loading = true;

      try {
        const { data: budgetMonth } = await this.api.months.getBudgetMonth(
          this.budgetId,
          this.selectedMonth
        );
        this.budgetMonthCategories = budgetMonth.month.categories
        console.log("budgetMonthCategories:", this.budgetMonthCategories);

      } catch (err) {
        this.error =
          err.error.detail ||
          "Failed to fetch budget details for selected month";
      } finally {
        this.loading = false;
      }
    },
    authorizeWithYNAB(e) {
      e.preventDefault();
      const uri = `https://app.ynab.com/oauth/authorize?client_id=${this.ynab.clientId}&redirect_uri=${this.ynab.redirectUri}&response_type=token&scope=read-only`;
      location.replace(uri);
    },
    findYNABToken() {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const params = Object.fromEntries(new URLSearchParams(hash));
        const token = params.access_token;
        sessionStorage.setItem("ynab_access_token", token);
        window.location.hash = "";
        return token;
      }
      return sessionStorage.getItem("ynab_access_token");
    },
    resetToken() {
      sessionStorage.removeItem("ynab_access_token");
      this.ynab.token = null;
      this.error = null;
    },
  },
};
</script>