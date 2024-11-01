/* Контекст */
import { eCreatorSlice } from "src/store/reducers/Creator/external/ECreatorSlice";

/* Константы */
import apiMainServer from "src/http/http";
import { FunctionVOID } from "src/types/function";
import { ICreateGameModel, IGameId } from "src/models/IGameModel";
import GameApi from "src/constants/api/game.api";
import messageQueueAction from "../../MessageQueueAction";
import { IInfoGameModel } from "src/models/ICreatorModel";

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

/**
 * Получение всех игр, которые были созданы пользователем
 * @param cb Функция обратного вызова
 * @returns
 */
function getCreatedGames(cb?: FunctionVOID) {
  return async function (dispatch: any) {
    dispatch(eCreatorSlice.actions.loadingStart());

    try {
      const response = await apiMainServer.get(GameApi.CREATED_GAMES);

      if (response.status !== 200 && response.status !== 201) {
        dispatch(messageQueueAction.addMessage(response, "error"));
        return;
      }

      dispatch(eCreatorSlice.actions.setGames(response.data));
      cb && cb();
    } catch (e: any) {
      dispatch(messageQueueAction.errorMessage(e));
    } finally {
      dispatch(eCreatorSlice.actions.loadingEnd());
    }
  };
}

/**
 * Удаление игры
 * @param id Идентификатор игры
 * @param cb Функция обратного вызова
 * @returns
 */
function deleteGame(id: IGameId, cb?: FunctionVOID) {
  return async function (dispatch: any) {
    dispatch(eCreatorSlice.actions.loadingStart());

    try {
      const response = await apiMainServer.post(
        GameApi.GAME_DELETE,
        JSON.stringify(id)
      );

      if (response.status !== 200 && response.status !== 201) {
        dispatch(messageQueueAction.addMessage(response, "error"));
        return;
      }

      dispatch(eCreatorSlice.actions.setEditGame(response.data));
      cb && cb();
    } catch (e: any) {
      dispatch(messageQueueAction.errorMessage(e));
    } finally {
      dispatch(eCreatorSlice.actions.loadingEnd());
    }
  };
}

/**
 * Получение информации об игре
 * @param id Идентификатор игры
 * @param cb Функция обратного вызова
 * @returns
 */
function gameInfo(id: IGameId, cb?: (value: IInfoGameModel) => void) {
  return async function (dispatch: any) {
    dispatch(eCreatorSlice.actions.loadingStart());

    try {
      const response = await apiMainServer.get(GameApi.GAME_INFO, {
        params: {
          info_games_id: id.info_games_id,
        },
      });

      if (response.status !== 200 && response.status !== 201) {
        dispatch(messageQueueAction.addMessage(response, "error"));
        return;
      }

      dispatch(eCreatorSlice.actions.setEditGame(response.data));
      cb && cb(response.data);
    } catch (e: any) {
      dispatch(messageQueueAction.errorMessage(e));
    } finally {
      dispatch(eCreatorSlice.actions.loadingEnd());
    }
  };
}

const ECreatorAction = {
  createGame,
  getCreatedGames,
  deleteGame,
  gameInfo,
};

export default ECreatorAction;
