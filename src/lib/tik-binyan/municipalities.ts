export interface MunicipalityConfig {
  name_he: string
  base_url: string
  search_method: 'GET' | 'POST'
  build_url: (params: {
    file_number?: string
    request_number?: string
    address?: string
    gush?: string
    helka?: string
  }) => string
}

export const MUNICIPALITIES: Record<string, MunicipalityConfig> = {
  ramat_gan: {
    name_he: 'רמת גן',
    base_url: 'https://handasa.ramat-gan.muni.il/tikbinyan/',
    search_method: 'GET',
    build_url: (params) => {
      const base = 'https://handasa.ramat-gan.muni.il/tikbinyan/'
      if (params.file_number) return `${base}?MisparTik=${encodeURIComponent(params.file_number)}`
      if (params.request_number) return `${base}?MisparBakasha=${encodeURIComponent(params.request_number)}`
      if (params.address) return `${base}?Ktovet=${encodeURIComponent(params.address)}`
      if (params.gush && params.helka) return `${base}?Gush=${encodeURIComponent(params.gush)}&Helka=${encodeURIComponent(params.helka)}`
      return base
    },
  },
  tel_aviv: {
    name_he: 'תל אביב-יפו',
    base_url: 'https://www.tel-aviv.gov.il/Residents/Engineering/',
    search_method: 'GET',
    build_url: (params) => {
      const base = 'https://www.tel-aviv.gov.il/Residents/Engineering/'
      if (params.file_number) return `${base}?tik=${encodeURIComponent(params.file_number)}`
      return base
    },
  },
  jerusalem: {
    name_he: 'ירושלים',
    base_url: 'https://www.jerusalem.muni.il/he/residents/engineering/',
    search_method: 'GET',
    build_url: (params) => {
      const base = 'https://www.jerusalem.muni.il/he/residents/engineering/'
      if (params.file_number) return `${base}?tik=${encodeURIComponent(params.file_number)}`
      return base
    },
  },
  haifa: {
    name_he: 'חיפה',
    base_url: 'https://www.haifa.muni.il/',
    search_method: 'GET',
    build_url: (params) => {
      const base = 'https://www.haifa.muni.il/engineering/'
      if (params.file_number) return `${base}?tik=${encodeURIComponent(params.file_number)}`
      return base
    },
  },
}

export const MUNICIPALITY_OPTIONS = Object.entries(MUNICIPALITIES).map(([key, config]) => ({
  value: key,
  label: config.name_he,
}))
