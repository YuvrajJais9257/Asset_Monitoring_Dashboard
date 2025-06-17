//today change
import { TOGGLE_THEME, SET_THEME } from "../constants/actionTypes";

const initialTheme = localStorage.getItem("dashboard_theme") || "light";

const themeReducer = (state = initialTheme, action) => {
  switch (action.type) {
    case TOGGLE_THEME: {
      const newTheme = state === "light" ? "dark" : "light";
      localStorage.setItem("dashboard_theme", newTheme);
      document.body.classList.remove("light", "dark");
      document.body.classList.add(newTheme);
      return newTheme;
    }
    case SET_THEME: {
      const theme = action.payload;
      localStorage.setItem("dashboard_theme", theme);
      document.body.classList.remove("light", "dark");
      document.body.classList.add(theme);
      return theme;
    }
    default:
      return state;
  }
};

export default themeReducer;