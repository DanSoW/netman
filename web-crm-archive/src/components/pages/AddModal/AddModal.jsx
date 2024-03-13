import React, { FC, useEffect, useState } from "react";
import styles from "./AddModal.module.css";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

const AddModal = ({
    addHandler,
    open,
    setOpen,
}) => {
    const handleOpen = () => setOpen(true);
    const [disable, setDisable] = useState(true);

    const handleClose = () => {
        setOpen(false);
    };

    const [form, setForm] = useState({
        location: "",
        lat: 0,
        lng: 0
    });

    const onChange = (data) => {
        setForm({
            ...form,
            [data.target.name]: data.target.value,
        });

        setDisable(false);
    };

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleAdd = () => {
        addHandler(form.location, form.lat, form.lng);
    };

    return (
        <>
            <div>
                <Dialog open={open} onClose={handleClose}>
                    <DialogTitle>Добавление новой метки</DialogTitle>
                    <DialogContent
                        style={{ overflowX: "hidden", padding: 15, margin: 0 }}
                    >
                        <DialogContentText></DialogContentText>
                        <div className={styles.content}>
                            <br />
                            <TextField
                                required={true}
                                id="outlined-basic"
                                type="text"
                                label="Местоположение метки"
                                variant="outlined"
                                name="location"
                                onChange={onChange}
                                sx={{
                                    width: "100%",
                                }}
                            />
                            <br />
                            <TextField
                                required={true}
                                id="outlined-basic"
                                type="number"
                                label="Координата latitude"
                                variant="outlined"
                                name="lat"
                                onChange={onChange}
                                sx={{
                                    width: "100%",
                                }}
                            />
                            <br />
                            <TextField
                                required={true}
                                id="outlined-basic"
                                type="number"
                                label="Координата longtitude"
                                variant="outlined"
                                name="lng"
                                onChange={onChange}
                                sx={{
                                    width: "100%",
                                }}
                            />
                            <br />
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Отмена</Button>
                        <Button onClick={handleAdd} disabled={disable}>
                            Добавить
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </>
    );
};

export default React.memo(AddModal);
