/* Контекст */
import { iCreatorSlice } from "src/store/reducers/Creator/internal/ICreatorSlice";

/* Константы */
import { FunctionVOID } from "src/types/function";
import { IQuestData } from "src/models/IQuestModel";
import { isVoidNull } from "src/types/void_null";

function addQuest(data: IQuestData, cb?: FunctionVOID) {
  return async function (dispatch: any) {
    dispatch(iCreatorSlice.actions.addQuest(data));
    cb && cb();
  };
}

function removeQuest(id: number, cb?: FunctionVOID) {
  return async function (dispatch: any) {
    dispatch(iCreatorSlice.actions.removeQuest(id));
    cb && cb();
  };
}

const ICreatorAction = {
  addQuest,
  removeQuest,
};

export default ICreatorAction;
