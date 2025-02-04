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
          <BudgetSelector :api="api" :budgetId="budgetId" @update:budgetId="budgetId = $event" />
          <MonthSelector v-model:selectedMonth="selectedMonth" :months="months" />
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
import SankeyMATIC from "./components/SankeyMATIC.vue";
import BudgetSelector from "./components/BudgetSelector.vue";
import MonthSelector from "./components/MonthSelector.vue";

export default {
  components: {
    Nav,
    Footer,
    SankeyMATIC,
    BudgetSelector,
    MonthSelector
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
      budgetId: "",
      months: [],
      selectedMonth: "current",
      budgetMonthCategories: []
    };
  },
  created() {
    this.ynab.token = this.findYNABToken();
    if (this.ynab.token) {
      this.api = new ynab.API(this.ynab.token);  // Initialize the API instance
      // No need to call getBudgets here anymore
    }
  },
  methods: {
    resetToken() {
      sessionStorage.removeItem("ynab_access_token");
      this.ynab.token = null;
      this.error = null;
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
    }
  }
};
</script>
