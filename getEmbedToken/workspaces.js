const workspaces = {
    signatureanalytics: {
        id: '77392655-0b1a-4155-a702-be372e795aa8',
        authenticationProvider: 'google',
        dashboards: {
            engagement: {
                id: 'da0df838-dbe5-47e0-9c7c-526898624cc5',
            },
            hoursdetail: {
                id: '86877f86-17f3-4bc3-9cf3-7bcfceeec696',
            },
            hr: {
                id: '1d29c950-edc1-400e-a56a-cd5b6189ed02',
            },
            market: {
                id: 'bdcb9bb4-1595-46dc-baed-7d8162be82c1',
            },
            revenue: {
                id: '9c544dc9-dc07-43dd-8191-f1ffe9eb45a7',
            },
            sales: {
                id: '8c45c507-8ed6-4165-9384-a7846e18f0d1',
            },
        },
        users: {
            'rwaldin@signatureanalytics.com': ['hr', 'revenue', 'engagement', 'hoursdetail', 'sales'],
            'cwagner@signatureanalyics.com': ['hr', 'revenue', 'engagement', 'hoursdetail', 'market', 'sales'],
            'dshannon@signatureanalytics.com': ['hr', 'revenue', 'engagement', 'hoursdetail', 'market', 'sales'],
            'arichards@signatureanalytics.com': ['hr', 'revenue', 'engagement', 'hoursdetail', 'market', 'sales'],
        },
    },
};

module.exports = workspaces;
