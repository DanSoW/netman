import React, { FC, useEffect, useState } from "react";
import styles from "./GameListPage.module.scss";
import Table from "src/components/Table";
import IconRouter from "src/components/Icons/Routers/IconRouter";
import Modal from "src/components/Modal";
import { useAppDispatch, useAppSelector } from "src/hooks/redux.hook";
import ECreatorAction from "src/store/actions/Creator/external/ECreatorAction";
import { DateTime } from "luxon";

export interface IGameItem {
    id: number;
    title: string;
    location: string;
    created_at: string;
    updated_at: string;
    count_quests: number;
};

/**
 * Список созданных игр
 * @returns 
 */
const GameListPage: FC<any> = () => {
    const [select, setSelect] = useState<number | null>(null);
    const [hover, setHover] = useState<number | null>(null);
    const [deleteItem, setDeleteItem] = useState<IGameItem | null>(null);

    const selectorGames = useAppSelector((s) => s.eCreatorReducer);
    const dispatch = useAppDispatch();

    const deleteItemConfirm = (item: IGameItem) => {
        setDeleteItem(item);
    };

    const deleteItemHandler = () => {

    };

    const closeDeleteModal = () => {
        setDeleteItem(null);
    };

    const onMouseEnterHandler = (item: IGameItem) => {
        setHover(item.id);
    };

    const onMouseLeaveHandler = () => {
        setHover(null);
    };

    const renderGameItem = (item: IGameItem) => {
        let defClass: string | null = null;
        if (select === item.id) {
            defClass = styles.rowItemSelect;
        } else if (hover === item.id) {
            defClass = styles.rowItemHover;
        } else {
            defClass = styles.rowItem;
        }

        const createdDate = DateTime
            .fromISO(item.created_at)
            .toFormat("dd.MM.yyyy HH:mm");

        const updatedDate = DateTime
            .fromISO(item.updated_at)
            .toFormat("dd.MM.yyyy HH:mm");

        return (
            <div
                data-id={item.id}
                className={defClass}
                onMouseEnter={() => {
                    onMouseEnterHandler(item);
                }}
                onClick={() => {
                    if (item.id === select) {
                        setSelect(null);
                    } else {
                        setSelect(item.id);
                    }
                }}
            >
                <div className={styles.rowCell}>
                    <p title={item.title}>{item.title}</p>
                </div>
                <div className={styles.rowCell}>
                    <p title={item.location}>{item.location}</p>
                </div>
                <div className={styles.rowCell}>
                    <p title={item.created_at}>{createdDate}</p>
                </div>
                <div className={styles.rowCell}>
                    <p title={item.updated_at}>{createdDate}</p>
                </div>
                <div className={styles.rowCell}>
                    <p title={`${item.count_quests}`}>{item.count_quests}</p>
                </div>
                <div className={styles.row} style={{ width: "81px" }}>
                    <IconRouter.PencilIcon width={32} height={32} color="#ffffff" />
                    <IconRouter.DeleteIcon
                        width={26}
                        height={26}
                        color="#ff0000"
                        clickHandler={() => {
                            deleteItemConfirm(item);
                        }}
                    />
                </div>
            </div>
        );
    };


    const toolbarDownItems = [
        {
            action: closeDeleteModal,
            title: "Удалить игру",
            label: "Да",
            width: 64
        },
        {
            action: closeDeleteModal,
            title: "Не удалять игру",
            label: "Нет",
            width: 64
        }
    ];

    useEffect(() => {
        dispatch(ECreatorAction.getCreatedGames());
    }, []);

    return (
        <>
            <div className={styles.container}>
                <h2>Список созданных игр</h2>
                <Table
                    columns={["Название", "Локация", "Дата создания", "Дата изменения", "Кол-во квестов"]}
                    data={selectorGames.games}
                    renderItem={renderGameItem}
                    onMouseLeaveHandler={onMouseLeaveHandler}
                />
            </div>

            {
                deleteItem && <Modal
                    isOpen={true}
                    title="Подтверждение удаления"
                    actionHandler={deleteItemHandler}
                    closeHandler={closeDeleteModal}
                    width={500}
                    height={200}
                    toolbarDownItems={toolbarDownItems}
                >
                    <div className={styles.columnModal}>
                        <p>Вы действительно хотите удалить игру "{deleteItem.title}"?</p>
                        <p>Все данные об игре будут удалены.</p>
                    </div>
                </Modal>
            }
        </>
    )
};

export default GameListPage;