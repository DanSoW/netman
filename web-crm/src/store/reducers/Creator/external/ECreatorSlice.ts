import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface ICreatorSlice_e {
  isLoading: boolean;
}

// Базовое состояние слайса
const initialState: ICreatorSlice_e = {
  isLoading: false,
};

/**
 * Создание слайса для авторизации пользователя
 */
export const eCreatorSlice = createSlice({
  name: "external_creator_slice",
  initialState,
  reducers: {
    loadingStart(state) {
      state.isLoading = true;
    },

    loadingEnd(state) {
      state.isLoading = false;
    },

    clear(state) {
      state.isLoading = false;
    },
  },
});

export default eCreatorSlice.reducer;
