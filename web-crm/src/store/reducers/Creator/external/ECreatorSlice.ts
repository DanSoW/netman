import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { IInfoGameModel } from "src/models/ICreatorModel";

export interface ICreatorSlice_e {
  isLoading: boolean;
  games: IInfoGameModel[];
}

// Базовое состояние слайса
const initialState: ICreatorSlice_e = {
  isLoading: false,
  games: []
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

    setGames(state, action: PayloadAction<IInfoGameModel[]>) {
      state.games = action.payload;
    }
  },
});

export default eCreatorSlice.reducer;
