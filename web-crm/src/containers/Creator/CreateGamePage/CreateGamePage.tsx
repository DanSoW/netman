import { FC, useState } from "react";
import styles from "./CreateGamePage.module.scss";
import GameParams from "src/components/pages/CreateGamePage/GameParams";
import Button from "src/components/UI/Button";
import QuestEditor from "src/components/pages/CreateGamePage/QuestEditor";
import QuestList from "src/components/pages/CreateGamePage/QuestList";
import Modal from "src/components/Modal";
import { InputValueType } from "src/types/input";
import { IMark } from "src/models/IMarkModel";
import Input from "src/components/UI/Input";
import { useAppDispatch } from "src/hooks/redux.hook";
import messageQueueAction from "src/store/actions/MessageQueueAction";

const CreateGamePage: FC<any> = () => {
    const dispatch = useAppDispatch();

    const [eventScroll, setEventScroll] = useState(0);
    const [updateQuestId, setUpdateQuestId] = useState<number>(-1);
    const [openAddMark, setOpenAddMark] = useState(false);

    const [dataMark, setDataMark] = useState<IMark>({
        location: '',
        lat: 0,
        lng: 0
    });

    const openHandler = () => {
        setOpenAddMark(true);
    }

    const closeHandler = () => {
        setOpenAddMark(false);
    };

    const inputChangeHandler = (type: "location" | "lat" | "lng") => {
        return (value: InputValueType) => {
            if (value) {
                const mark = JSON.parse(JSON.stringify(dataMark)) as IMark;

                if (type === "location") {
                    mark.location = String(value);
                } else {
                    console.log(String(value));
                    if (String(value).trim().length === 0) {
                        mark[type] = 0;
                    } else {
                        mark[type] = Number(value);
                    }
                }

                setDataMark(mark);
            }
        };
    };

    const addMarkHandler = () => {
        if (dataMark.location.trim().length === 0) {
            dispatch(messageQueueAction.addMessage(null, "error", "Необходимо добавить местоположение"));
            return;
        } else if (!dataMark.lat) {
            dispatch(messageQueueAction.addMessage(null, "error", "Необходимо добавить координату lat"));
            return;
        } else if (!dataMark.lng) {
            dispatch(messageQueueAction.addMessage(null, "error", "Необходимо добавить координату lng"));
            return;
        }
    };

    return (
        <>
            <div className={styles.page}>
                <GameParams />
                <Button
                    label={"Добавить новую метку на карту"}
                    width={300}
                    clickHandler={openHandler}
                />
                <QuestEditor
                    eventScroll={eventScroll}
                    updateQuestId={updateQuestId}
                    setUpdateQuestId={setUpdateQuestId}
                />
                <QuestList
                    updateQuestId={updateQuestId}
                    setUpdateQuestId={setUpdateQuestId}
                    setEventScroll={setEventScroll}
                />
                <Modal
                    isOpen={openAddMark}
                    title="Добавление новой метки"
                    actionHandler={addMarkHandler}
                    closeHandler={closeHandler}
                    width={500}
                    height={400}
                >
                    <div className={styles.modal_container}>
                        <div className={styles.modal_holder}>
                            <div className={styles.modal_add_mark}>
                                <Input
                                    name="location"
                                    label="Местоположение"
                                    defaultValue={''}
                                    changeHandler={inputChangeHandler("location")}
                                    width={"300px"}
                                    required
                                />
                                <Input
                                    type="number"
                                    name="lat"
                                    label="Координата lat"
                                    defaultValue={''}
                                    changeHandler={inputChangeHandler("lat")}
                                    width={"300px"}
                                    required
                                />
                                <Input
                                    type="number"
                                    name="lng"
                                    label="Координата lng"
                                    defaultValue={''}
                                    changeHandler={inputChangeHandler("lng")}
                                    width={"300px"}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>
        </>
    );
};

export default CreateGamePage;
