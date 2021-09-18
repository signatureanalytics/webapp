const workspaces = {
    signatureanalytics: {
        id: '77392655-0b1a-4155-a702-be372e795aa8',
        reports: {
            Engagement: {
                id: 'da0df838-dbe5-47e0-9c7c-526898624cc5',
            },
            'Hours Detail': {
                id: '86877f86-17f3-4bc3-9cf3-7bcfceeec696',
            },
            HR: {
                id: '1d29c950-edc1-400e-a56a-cd5b6189ed02',
            },
            Market: {
                id: 'bdcb9bb4-1595-46dc-baed-7d8162be82c1',
            },
            Revenue: {
                id: '9c544dc9-dc07-43dd-8191-f1ffe9eb45a7',
            },
            Sales: {
                id: '8c45c507-8ed6-4165-9384-a7846e18f0d1',
            },
        },
        users: {
            google: {
                'rwaldin@signatureanalytics.com': ['HR', 'Revenue', 'Engagement', 'Hours Detail', 'Market'],
                'cwagner@signatureanalyics.com': ['HR', 'Revenue', 'Engagement', 'Hours Detail', 'Market', 'Sales'],
                'dshannon@signatureanalytics.com': ['HR', 'Revenue', 'Engagement', 'Hours Detail', 'Market', 'Sales'],
                'arichards@signatureanalytics.com': ['HR', 'Revenue', 'Engagement', 'Hours Detail', 'Market', 'Sales'],
            },
        },
    },
};

module.exports = workspaces;
