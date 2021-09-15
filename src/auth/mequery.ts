import { gql } from "@app/gql";

const Me = gql(/* GraphQL */ `
    query Me {
    me {
        id
    }
    }
`);

export default Me;