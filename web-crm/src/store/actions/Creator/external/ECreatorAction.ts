/* Контекст */
import { eCreatorSlice } from "src/store/reducers/Creator/external/ECreatorSlice";

/* Константы */
import apiMainServer from "src/http/http";
import { FunctionVOID } from "src/types/function";
import { ICreateGameModel } from "src/models/IGameModel";
import GameApi from "src/constants/api/game.api";
import messageQueueAction from "../../MessageQueueAction";

/**
 * Создание новой игры
 * @param data Данные игры
 * @param cb Функция обратного вызова
 * @returns
 */
function createGame(data: ICreateGameModel, cb?: FunctionVOID) {
  return async function (dispatch: any) {
    dispatch(eCreatorSlice.actions.loadingStart());

    try {
      const response = await apiMainServer.post(
        GameApi.CREATE_GAME,
        JSON.stringify(data)
      );

      if (response.status !== 200 && response.status !== 201) {
        dispatch(messageQueueAction.addMessage(response, "error"));
        return;
      }

      cb && cb();
    } catch (e: any) {
      dispatch(messageQueueAction.errorMessage(e));
    } finally {
      dispatch(eCreatorSlice.actions.loadingEnd());
    }
  };
}

function getCreatedGames(cb?: FunctionVOID) {
  return async function (dispatch: any) {
    dispatch(eCreatorSlice.actions.loadingStart());

    try {
      const response = await apiMainServer.get(
        GameApi.CREATED_GAMES
      );

      if (response.status !== 200 && response.status !== 201) {
        dispatch(messageQueueAction.addMessage(response, "error"));
        return;
      }

      dispatch(eCreatorSlice.actions.setGames(response.data));
      cb && cb();
    } catch(e: any) {
      dispatch(messageQueueAction.errorMessage(e));
    } finally {
      dispatch(eCreatorSlice.actions.loadingEnd());
    }
  };
}

const ECreatorAction = {
  createGame,
  getCreatedGames
};

export default ECreatorAction;
