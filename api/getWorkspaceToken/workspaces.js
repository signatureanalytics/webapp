const workspaces = {
    signatureanalytics: {
        name: 'Signature Analytics',
        id: 'f9b1241e-ef36-489b-bc2e-eba05b970c73',
        reports: {
            Engagement: {
                id: '81309e92-a565-4923-b21a-db5a34e89ddf',
                dataset: '02388529-7943-48fb-9bdd-4e58fa33f24f',
            },
            'Hours Detail': {
                id: '8923f976-8955-4bbe-a699-bcc32200ff93',
                dataset: '2bca7dd9-6623-45e7-b029-5f10b0fa7808',
            },
            HR: {
                id: 'c33f6afb-6a37-41c5-873b-fa339a9edeb7',
                dataset: '8e655a98-d97f-48d0-a0d4-587ec336df50',
            },
            Market: {
                id: '780e87ed-3bed-4de7-830b-da5e1464dbe0',
                dataset: '23a9d1ae-95c1-41c7-85af-1fb81d3352f7',
            },
            Revenue: {
                id: '993e591f-cbe7-47a4-b285-087ae4b6e5ee',
                dataset: '762291f6-85c9-4e72-8d52-e3fec5655c95',
            },
            Sales: {
                id: '11c867d4-6dd5-452f-b2c1-943a1f2eb3bc',
                dataset: '9fa7e2ad-6e9e-4c69-aed8-f9d9086d6e02',
            },
        },
        users: {
            google: {
                'rwaldin@signatureanalytics.com': ['HR', 'Revenue', 'Engagement', 'Hours Detail', 'Market', 'Sales'],
                'cwagner@signatureanalyics.com': ['HR', 'Revenue', 'Engagement', 'Hours Detail', 'Market', 'Sales'],
                'dshannon@signatureanalytics.com': ['HR', 'Revenue', 'Engagement', 'Hours Detail', 'Market', 'Sales'],
                'arichards@signatureanalytics.com': ['HR', 'Revenue', 'Engagement', 'Hours Detail', 'Market', 'Sales'],
            },
        },
    },
};

module.exports = workspaces;
