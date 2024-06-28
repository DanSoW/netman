import { FC, useEffect, useState } from "react";
import styles from "./QuestParams.module.css";
import Input from "src/components/UI/Input";
import TextArea from "src/components/UI/TextArea";
import InputRange from "src/components/UI/InputRange";
import Button from "src/components/UI/Button";
import { useAppDispatch, useAppSelector } from "src/hooks/redux.hook";
import messageQueueAction from "src/store/actions/MessageQueueAction";
import { InputValueType } from "src/types/input";
import { IMarkModel } from "src/models/IMarkModel";
import { IQuestDataModel } from "src/models/IQuestModel";
import { v4 } from "uuid";
import ICreatorAction from "src/store/actions/Creator/internal/ICreatorAction";
import { FunctionVOID } from "src/types/function";

export interface IQuestParamsProps {
    dataQuest: IQuestDataModel;
    setDataQuest: React.Dispatch<React.SetStateAction<IQuestDataModel>>;
    selectMark: IMarkModel;
    clearSelectMark: FunctionVOID;
    clearDataQuest: FunctionVOID;
}

const QuestParams: FC<IQuestParamsProps> = (props) => {
    const {
        selectMark, dataQuest, setDataQuest,
        clearSelectMark, clearDataQuest
    } = props;
    const iCreatorSelector = useAppSelector((s) => s.iCreatorReducer);
    const dispatch = useAppDispatch();

    const inputChangeHandler = (type: string) => {
        return (value: InputValueType) => {
            setDataQuest({
                ...dataQuest,
                [type]: (type === "radius") ? Number(value) : value
            });
        };
    };

    return (
        <>
            <div className={styles.container}>
                <div className={styles.content}>
                    <Input
                        label="Местоположение"
                        readOnly={true}
                        defaultValue={selectMark.location}
                        required
                    />
                    <Input
                        name="hint"
                        label="Подсказка"
                        defaultValue={dataQuest.hint}
                        changeHandler={inputChangeHandler("hint")}
                        required
                    />
                    <TextArea
                        name="task"
                        label="Задача"
                        defaultValue={dataQuest.task}
                        changeHandler={inputChangeHandler("task")}
                        title="Основная задача (какова цель?)"
                        required
                    />
                    <TextArea
                        name="action"
                        label="Действие"
                        defaultValue={dataQuest.action}
                        changeHandler={inputChangeHandler("action")}
                        title="Конкретное действие (что именно нужно сделать?)"
                        required
                    />
                    <InputRange
                        name="radius"
                        label="Радиус действия"
                        defaultValue={dataQuest.radius}
                        changeHandler={inputChangeHandler("radius")}
                        title="В рамках этого радиуса пользователь сможет определить квест"
                        required
                    />
                </div>

                <div className={styles.controls}>
                    <Button
                        label="Очистить"
                        clickHandler={() => {
                            clearSelectMark();
                            clearDataQuest();

                            dispatch(messageQueueAction.addMessage(null, "dark", "Форма очищена"));
                        }}
                    />
                    <Button
                        label={(dataQuest.id) ? "Изменить" : "Добавить"}
                        clickHandler={() => {
                            const index = iCreatorSelector.quests.findIndex((value) => {
                                return value.id === selectMark.id
                            });

                            if (index >= 0) {
                                dispatch(messageQueueAction.addMessage(null, "error", "Квест с данной меткой уже добавлен!"));
                                return;
                            }

                            const data = {
                                ...dataQuest,
                                mark: selectMark,
                                id: selectMark.id
                            };

                            dispatch(ICreatorAction.addQuest(data, () => {
                                clearSelectMark();
                                clearDataQuest();

                                dispatch(messageQueueAction.addMessage(null, "success", "Квест добавлен!"));
                            }));
                        }}
                    />
                </div>
            </div>
        </>
    );
};

export default QuestParams;
