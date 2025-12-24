// src/enums.ts

// --------------------------------------------------------------------------
// Developer Status
// --------------------------------------------------------------------------
export enum DeveloperStatus {
    ACTIVE = 'A',
    INACTIVE = 'X'
}

export const DeveloperStatusLabels: Record<DeveloperStatus, string> = {
    [DeveloperStatus.ACTIVE]: 'Active',
    [DeveloperStatus.INACTIVE]: 'Inactive',
};

// --------------------------------------------------------------------------
// Land Status
// --------------------------------------------------------------------------
export enum LandStatus {
    ACQUIRED = 'A',
    DEVELOPED = 'D',
    DISPOSED = 'X', 
}

export const LandStatusLabels: Record<LandStatus, string> = {
    [LandStatus.ACQUIRED]: 'Acquired',
    [LandStatus.DEVELOPED]: 'Developed',
    [LandStatus.DISPOSED]: 'Disposed',
};

// --------------------------------------------------------------------------
// Land Tenure
// --------------------------------------------------------------------------
export enum LandTenureType {
    FREEHOLD = 'F',
    LEASEHOLD = 'L',
}

export const LandTenureTypeLabels: Record<LandTenureType, string> = {
    [LandTenureType.FREEHOLD]: 'Freehold',
    [LandTenureType.LEASEHOLD]: 'Leasehold',
};

// --------------------------------------------------------------------------
// Project Status
// --------------------------------------------------------------------------
export enum ProjectStatus {
    PLANNING = 'P',
    APPROVED = 'A',
    PROGRESS = 'G',
    COMPLETED = 'C',
    CANCELLED = 'X',
}

export const ProjectStatusLabels: Record<ProjectStatus, string> = {
    [ProjectStatus.PLANNING]: 'Planning',
    [ProjectStatus.APPROVED]: 'Approved',
    [ProjectStatus.PROGRESS]: 'In Progress',
    [ProjectStatus.COMPLETED]: 'Completed',
    [ProjectStatus.CANCELLED]: 'Cancelled',
};

// --------------------------------------------------------------------------
// Category Status
// --------------------------------------------------------------------------
export enum CategoryStatus {
    ACTIVE = 'A',
    INACTIVE = 'X',
}

export const CategoryStatusLabels: Record<CategoryStatus, string> = {
    [CategoryStatus.ACTIVE]: 'Active',
    [CategoryStatus.INACTIVE]: 'Inactive',
};

// --------------------------------------------------------------------------
// Group Status
// --------------------------------------------------------------------------
export enum GroupStatus {
    ACTIVE = 'A',
    INACTIVE = 'X',
}

export const GroupStatusLabels: Record<GroupStatus, string> = {
    [GroupStatus.ACTIVE]: 'Active',
    [GroupStatus.INACTIVE]: 'Inactive',
};

// --------------------------------------------------------------------------
// Country
// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
// Country Enum (ISO 3166-1 alpha-2)
// --------------------------------------------------------------------------
export enum Country {
    AFGHANISTAN = 'AF',
    ALAND_ISLANDS = 'AX',
    ALBANIA = 'AL',
    ALGERIA = 'DZ',
    AMERICAN_SAMOA = 'AS',
    ANDORRA = 'AD',
    ANGOLA = 'AO',
    ANGUILLA = 'AI',
    ANTARCTICA = 'AQ',
    ANTIGUA_AND_BARBUDA = 'AG',
    ARGENTINA = 'AR',
    ARMENIA = 'AM',
    ARUBA = 'AW',
    AUSTRALIA = 'AU',
    AUSTRIA = 'AT',
    AZERBAIJAN = 'AZ',
    BAHAMAS = 'BS',
    BAHRAIN = 'BH',
    BANGLADESH = 'BD',
    BARBADOS = 'BB',
    BELARUS = 'BY',
    BELGIUM = 'BE',
    BELIZE = 'BZ',
    BENIN = 'BJ',
    BERMUDA = 'BM',
    BHUTAN = 'BT',
    BOLIVIA = 'BO',
    BONAIRE_SINT_EUSTATIUS_AND_SABA = 'BQ',
    BOSNIA_AND_HERZEGOVINA = 'BA',
    BOTSWANA = 'BW',
    BOUVET_ISLAND = 'BV',
    BRAZIL = 'BR',
    BRITISH_INDIAN_OCEAN_TERRITORY = 'IO',
    BRUNEI_DARUSSALAM = 'BN',
    BULGARIA = 'BG',
    BURKINA_FASO = 'BF',
    BURUNDI = 'BI',
    CAMBODIA = 'KH',
    CAMEROON = 'CM',
    CANADA = 'CA',
    CAPE_VERDE = 'CV',
    CAYMAN_ISLANDS = 'KY',
    CENTRAL_AFRICAN_REPUBLIC = 'CF',
    CHAD = 'TD',
    CHILE = 'CL',
    CHINA = 'CN',
    CHRISTMAS_ISLAND = 'CX',
    COCOS_KEELING_ISLANDS = 'CC',
    COLOMBIA = 'CO',
    COMOROS = 'KM',
    CONGO = 'CG',
    CONGO_DEMOCRATIC_REPUBLIC = 'CD',
    COOK_ISLANDS = 'CK',
    COSTA_RICA = 'CR',
    COTE_DIVOIRE = 'CI',
    CROATIA = 'HR',
    CUBA = 'CU',
    CURACAO = 'CW',
    CYPRUS = 'CY',
    CZECH_REPUBLIC = 'CZ',
    DENMARK = 'DK',
    DJIBOUTI = 'DJ',
    DOMINICA = 'DM',
    DOMINICAN_REPUBLIC = 'DO',
    ECUADOR = 'EC',
    EGYPT = 'EG',
    EL_SALVADOR = 'SV',
    EQUATORIAL_GUINEA = 'GQ',
    ERITREA = 'ER',
    ESTONIA = 'EE',
    ETHIOPIA = 'ET',
    FALKLAND_ISLANDS = 'FK',
    FAROE_ISLANDS = 'FO',
    FIJI = 'FJ',
    FINLAND = 'FI',
    FRANCE = 'FR',
    FRENCH_GUIANA = 'GF',
    FRENCH_POLYNESIA = 'PF',
    FRENCH_SOUTHERN_TERRITORIES = 'TF',
    GABON = 'GA',
    GAMBIA = 'GM',
    GEORGIA = 'GE',
    GERMANY = 'DE',
    GHANA = 'GH',
    GIBRALTAR = 'GI',
    GREECE = 'GR',
    GREENLAND = 'GL',
    GRENADA = 'GD',
    GUADELOUPE = 'GP',
    GUAM = 'GU',
    GUATEMALA = 'GT',
    GUERNSEY = 'GG',
    GUINEA = 'GN',
    GUINEA_BISSAU = 'GW',
    GUYANA = 'GY',
    HAITI = 'HT',
    HEARD_ISLAND_AND_MCDONALD_ISLANDS = 'HM',
    HOLY_SEE = 'VA',
    HONDURAS = 'HN',
    HONG_KONG = 'HK',
    HUNGARY = 'HU',
    ICELAND = 'IS',
    INDIA = 'IN',
    INDONESIA = 'ID',
    IRAN = 'IR',
    IRAQ = 'IQ',
    IRELAND = 'IE',
    ISLE_OF_MAN = 'IM',
    ISRAEL = 'IL',
    ITALY = 'IT',
    JAMAICA = 'JM',
    JAPAN = 'JP',
    JERSEY = 'JE',
    JORDAN = 'JO',
    KAZAKHSTAN = 'KZ',
    KENYA = 'KE',
    KIRIBATI = 'KI',
    KOREA_DEMOCRATIC_PEOPLES_REPUBLIC = 'KP',
    KOREA_REPUBLIC = 'KR',
    KUWAIT = 'KW',
    KYRGYZSTAN = 'KG',
    LAO_PEOPLES_DEMOCRATIC_REPUBLIC = 'LA',
    LATVIA = 'LV',
    LEBANON = 'LB',
    LESOTHO = 'LS',
    LIBERIA = 'LR',
    LIBYA = 'LY',
    LIECHTENSTEIN = 'LI',
    LITHUANIA = 'LT',
    LUXEMBOURG = 'LU',
    MACAO = 'MO',
    MACEDONIA = 'MK',
    MADAGASCAR = 'MG',
    MALAWI = 'MW',
    MALAYSIA = 'MY',
    MALDIVES = 'MV',
    MALI = 'ML',
    MALTA = 'MT',
    MARSHALL_ISLANDS = 'MH',
    MARTINIQUE = 'MQ',
    MAURITANIA = 'MR',
    MAURITIUS = 'MU',
    MAYOTTE = 'YT',
    MEXICO = 'MX',
    MICRONESIA = 'FM',
    MOLDOVA = 'MD',
    MONACO = 'MC',
    MONGOLIA = 'MN',
    MONTENEGRO = 'ME',
    MONTSERRAT = 'MS',
    MOROCCO = 'MA',
    MOZAMBIQUE = 'MZ',
    MYANMAR = 'MM',
    NAMIBIA = 'NA',
    NAURU = 'NR',
    NEPAL = 'NP',
    NETHERLANDS = 'NL',
    NEW_CALEDONIA = 'NC',
    NEW_ZEALAND = 'NZ',
    NICARAGUA = 'NI',
    NIGER = 'NE',
    NIGERIA = 'NG',
    NIUE = 'NU',
    NORFOLK_ISLAND = 'NF',
    NORTHERN_MARIANA_ISLANDS = 'MP',
    NORWAY = 'NO',
    OMAN = 'OM',
    PAKISTAN = 'PK',
    PALAU = 'PW',
    PALESTINE = 'PS',
    PANAMA = 'PA',
    PAPUA_NEW_GUINEA = 'PG',
    PARAGUAY = 'PY',
    PERU = 'PE',
    PHILIPPINES = 'PH',
    PITCAIRN = 'PN',
    POLAND = 'PL',
    PORTUGAL = 'PT',
    PUERTO_RICO = 'PR',
    QATAR = 'QA',
    REUNION = 'RE',
    ROMANIA = 'RO',
    RUSSIAN_FEDERATION = 'RU',
    RWANDA = 'RW',
    SAINT_BARTHELEMY = 'BL',
    SAINT_HELENA = 'SH',
    SAINT_KITTS_AND_NEVIS = 'KN',
    SAINT_LUCIA = 'LC',
    SAINT_MARTIN = 'MF',
    SAINT_PIERRE_AND_MIQUELON = 'PM',
    SAINT_VINCENT_AND_THE_GRENADINES = 'VC',
    SAMOA = 'WS',
    SAN_MARINO = 'SM',
    SAO_TOME_AND_PRINCIPE = 'ST',
    SAUDI_ARABIA = 'SA',
    SENEGAL = 'SN',
    SERBIA = 'RS',
    SEYCHELLES = 'SC',
    SIERRA_LEONE = 'SL',
    SINGAPORE = 'SG',
    SINT_MAARTEN = 'SX',
    SLOVAKIA = 'SK',
    SLOVENIA = 'SI',
    SOLOMON_ISLANDS = 'SB',
    SOMALIA = 'SO',
    SOUTH_AFRICA = 'ZA',
    SOUTH_GEORGIA_AND_THE_SOUTH_SANDWICH_ISLANDS = 'GS',
    SOUTH_SUDAN = 'SS',
    SPAIN = 'ES',
    SRI_LANKA = 'LK',
    SUDAN = 'SD',
    SURINAME = 'SR',
    SVALBARD_AND_JAN_MAYEN = 'SJ',
    SWAZILAND = 'SZ',
    SWEDEN = 'SE',
    SWITZERLAND = 'CH',
    SYRIAN_ARAB_REPUBLIC = 'SY',
    TAIWAN = 'TW',
    TAJIKISTAN = 'TJ',
    TANZANIA = 'TZ',
    THAILAND = 'TH',
    TIMOR_LESTE = 'TL',
    TOGO = 'TG',
    TOKELAU = 'TK',
    TONGA = 'TO',
    TRINIDAD_AND_TOBAGO = 'TT',
    TUNISIA = 'TN',
    TURKIYE = 'TR',
    TURKMENISTAN = 'TM',
    TURKS_AND_CAICOS_ISLANDS = 'TC',
    TUVALU = 'TV',
    UGANDA = 'UG',
    UKRAINE = 'UA',
    UNITED_ARAB_EMIRATES = 'AE',
    UNITED_KINGDOM = 'GB',
    UNITED_STATES = 'US',
    UNITED_STATES_MINOR_OUTLYING_ISLANDS = 'UM',
    URUGUAY = 'UY',
    UZBEKISTAN = 'UZ',
    VANUATU = 'VU',
    VENEZUELA = 'VE',
    VIET_NAM = 'VN',
    VIRGIN_ISLANDS_BRITISH = 'VG',
    VIRGIN_ISLANDS_US = 'VI',
    WALLIS_AND_FUTUNA = 'WF',
    WESTERN_SAHARA = 'EH',
    YEMEN = 'YE',
    ZAMBIA = 'ZM',
    ZIMBABWE = 'ZW',
}

// --------------------------------------------------------------------------
// Country Helpers
// --------------------------------------------------------------------------

// Initialize the display names for English (or use 'undefined' for user's system locale)
const englishRegionNames = new Intl.DisplayNames(['en'], { type: 'region' });

/**
 * Returns the human-readable English name of a country code.
 * @param countryCode - The ISO 3166-1 alpha-2 code (e.g., Country.MALAYSIA)
 */
export function getCountryLabel(countryCode: Country | string): string {
    // .of() may throw if code is invalid, or return the code itself if unknown.
    // We add a try/catch just to be safe, though strict typing usually prevents this.
    try {
        return englishRegionNames.of(countryCode) || countryCode;
    } catch (e) {
        return countryCode;
    }
}

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