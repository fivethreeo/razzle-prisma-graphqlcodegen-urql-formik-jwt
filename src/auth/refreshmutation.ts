import { gql } from "@app/gql";

const Refresh = gql(`
    mutation Refresh {
    refreshTokens {
        success
    }
    }
`);

export default Refresh;