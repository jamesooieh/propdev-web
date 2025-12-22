// src/enums.ts

// --------------------------------------------------------------------------
// Developer Status
// --------------------------------------------------------------------------
export enum DeveloperStatus {
    ACTIVE = 'A',
    INACTIVE = 'X'
}

// Helper to display "Active" instead of "A"
export const DeveloperStatusLabels: Record<DeveloperStatus, string> = {
    [DeveloperStatus.ACTIVE]: 'Active',
    [DeveloperStatus.INACTIVE]: 'Inactive'
};

// --------------------------------------------------------------------------
// Country
// --------------------------------------------------------------------------
export enum Country {
    MALAYSIA = 'MY',
    SINGAPORE = 'SG'
}

export const CountryLabels: Record<Country, string> = {
    [Country.MALAYSIA]: 'Malaysia',
    [Country.SINGAPORE]: 'Singapore'
};

// --------------------------------------------------------------------------
// Malaysia State
// --------------------------------------------------------------------------
export enum MalaysiaState {
    JOHOR = '01',
    KEDAH = '02',
    KELANTAN = '03',
    MELAKA = '04',
    NEGERI_SEMBILAN = '05',
    PAHANG = '06',
    PULAU_PINANG = '07',
    PERAK = '08',
    PERLIS = '09',
    SELANGOR = '10',
    TERENGGANU = '11',
    SABAH = '12',
    SARAWAK = '13',
    WP_KUALA_LUMPUR = '14',
    WP_LABUAN = '15',
    WP_PUTRAJAYA = '16'
}

export const MalaysiaStateLabels: Record<MalaysiaState, string> = {
    [MalaysiaState.JOHOR]: 'Johor',
    [MalaysiaState.KEDAH]: 'Kedah',
    [MalaysiaState.KELANTAN]: 'Kelantan',
    [MalaysiaState.MELAKA]: 'Melaka',
    [MalaysiaState.NEGERI_SEMBILAN]: 'Negeri Sembilan',
    [MalaysiaState.PAHANG]: 'Pahang',
    [MalaysiaState.PULAU_PINANG]: 'Pulau Pinang',
    [MalaysiaState.PERAK]: 'Perak',
    [MalaysiaState.PERLIS]: 'Perlis',
    [MalaysiaState.SELANGOR]: 'Selangor',
    [MalaysiaState.TERENGGANU]: 'Terengganu',
    [MalaysiaState.SABAH]: 'Sabah',
    [MalaysiaState.SARAWAK]: 'Sarawak',
    [MalaysiaState.WP_KUALA_LUMPUR]: 'W.P. Kuala Lumpur',
    [MalaysiaState.WP_LABUAN]: 'W.P. Labuan',
    [MalaysiaState.WP_PUTRAJAYA]: 'W.P. Putrajaya'
};