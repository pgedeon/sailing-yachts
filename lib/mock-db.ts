// In-memory mock database for admin resources
// Note: This state is per-server-instance and will reset on server restart

export type Manufacturer = {
  id: number
  name: string
  country?: string
  foundedYear?: number
  websiteUrl?: string
  logoUrl?: string
  description?: string
}

export type Yacht = {
  id: number
  modelName: string
  manufacturer: { id: number; name: string } | null
  year?: number
  lengthOverall?: number
  beam?: number
  draft?: number
  displacement?: number
  ballast?: number
  mainSailArea?: number
  rigType?: string
  keelType?: string
  hullMaterial?: string
  cabins?: number
  berths?: number
  heads?: number
  maxOccupancy?: number
  engineHP?: number
  engineType?: string
  fuelCapacity?: number
  waterCapacity?: number
  designNotes?: string
  description?: string
}

export type SpecCategory = {
  id: number
  name: string
  dataType: string
  unit?: string
  description?: string
  group?: string
  filterable?: boolean
}

// Initial seed data
let manufacturers: Manufacturer[] = [
  { id: 26, name: 'Jeanneau', country: 'France', foundedYear: 1954 },
  { id: 27, name: 'Beneteau', country: 'France', foundedYear: 1884 },
  { id: 28, name: 'Hanse', country: 'Germany', foundedYear: 1990 },
  { id: 29, name: 'Catalina', country: 'USA', foundedYear: 1969 }
]

let yachts: Yacht[] = [
  {
    id: 26,
    modelName: 'Oceanis 30.1',
    manufacturer: { id: 26, name: 'Jeanneau' },
    year: 2023,
    lengthOverall: 9.11,
    beam: 3.19,
    draft: 1.83
  },
  {
    id: 27,
    modelName: 'Sun Odyssey 349',
    manufacturer: { id: 26, name: 'Jeanneau' },
    year: 2022,
    lengthOverall: 10.49,
    beam: 3.83,
    draft: 1.95
  },
  {
    id: 28,
    modelName: 'Oceanis 38.1',
    manufacturer: { id: 27, name: 'Beneteau' },
    year: 2024,
    lengthOverall: 11.18,
    beam: 3.97,
    draft: 1.98
  }
]

let specCategories: SpecCategory[] = [
  { id: 59, name: 'Length Overall', dataType: 'numeric', unit: 'm', description: 'Total length of the yacht' },
  { id: 60, name: 'Beam', dataType: 'numeric', unit: 'm', description: 'Width of the yacht at its widest point' },
  { id: 61, name: 'Draft', dataType: 'numeric', unit: 'm', description: 'Depth of hull below waterline' },
  { id: 62, name: 'Displacement', dataType: 'numeric', unit: 'kg', description: 'Weight of the yacht in water' },
  { id: 63, name: 'Sail Area - Main', dataType: 'numeric', unit: 'm²', description: 'Area of the main sail' }
]

// Manufacturers CRUD
export function getManufacturers() {
  return manufacturers
}

export function getManufacturerById(id: number) {
  return manufacturers.find(m => m.id === id)
}

export function createManufacturer(data: Partial<Manufacturer>) {
  const newId = Math.max(...manufacturers.map(m => m.id), 0) + 1
  const manufacturer: Manufacturer = {
    id: newId,
    name: data.name || '',
    country: data.country,
    foundedYear: data.foundedYear,
    websiteUrl: data.websiteUrl,
    logoUrl: data.logoUrl,
    description: data.description
  }
  manufacturers.push(manufacturer)
  return manufacturer
}

export function deleteManufacturer(id: number) {
  const index = manufacturers.findIndex(m => m.id === id)
  if (index !== -1) {
    manufacturers.splice(index, 1)
    return true
  }
  return false
}

// Yachts CRUD
export function getYachts() {
  return yachts
}

export function getYachtById(id: number) {
  return yachts.find(y => y.id === id)
}

export function createYacht(data: Partial<Yacht>) {
  const newId = Math.max(...yachts.map(y => y.id), 0) + 1
  const yacht: Yacht = {
    id: newId,
    modelName: data.modelName || '',
    manufacturer: data.manufacturer || null,
    year: data.year,
    lengthOverall: data.lengthOverall,
    beam: data.beam,
    draft: data.draft,
    displacement: data.displacement,
    ballast: data.ballast,
    mainSailArea: data.mainSailArea,
    rigType: data.rigType,
    keelType: data.keelType,
    hullMaterial: data.hullMaterial,
    cabins: data.cabins,
    berths: data.berths,
    heads: data.heads,
    maxOccupancy: data.maxOccupancy,
    engineHP: data.engineHP,
    engineType: data.engineType,
    fuelCapacity: data.fuelCapacity,
    waterCapacity: data.waterCapacity,
    designNotes: data.designNotes,
    description: data.description
  }
  yachts.push(yacht)
  return yacht
}

export function deleteYacht(id: number) {
  const index = yachts.findIndex(y => y.id === id)
  if (index !== -1) {
    yachts.splice(index, 1)
    return true
  }
  return false
}

// Spec Categories CRUD
export function getSpecCategories() {
  return specCategories
}

export function getSpecCategoryById(id: number) {
  return specCategories.find(c => c.id === id)
}

export function createSpecCategory(data: Partial<SpecCategory>) {
  const newId = Math.max(...specCategories.map(c => c.id), 0) + 1
  const category: SpecCategory = {
    id: newId,
    name: data.name || '',
    dataType: data.dataType || 'string',
    unit: data.unit,
    description: data.description,
    group: data.group,
    filterable: data.filterable ?? false
  }
  specCategories.push(category)
  return category
}

export function deleteSpecCategory(id: number) {
  const index = specCategories.findIndex(c => c.id === id)
  if (index !== -1) {
    specCategories.splice(index, 1)
    return true
  }
  return false
}
