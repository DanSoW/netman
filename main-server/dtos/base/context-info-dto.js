class ContextInfoDto {
    users_id;
    context_user_data;

    constructor(model) {
        this.users_id = model.users_id;
        this.context_user_data = model.context_user_data;
    }
}

export default ContextInfoDto;