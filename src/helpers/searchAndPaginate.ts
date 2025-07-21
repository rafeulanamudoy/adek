import { Prisma } from "@prisma/client";

const searchAndPaginate = async <T>(
  model: any,
  searchableFields: (keyof T)[],
  page: number = 1,
  limit: number = 10,
  searchQuery: string = "",
  additionalFilter: Record<string, any> = {},
  selectFields?: {
    select?: Record<string, any>;
    include?: Record<string, any>;
  },
  orderField: string = "createdAt",
  orderPositiion: string = "desc"
) => {
  const skip = (page - 1) * limit;

  let searchFilter: Record<string, any> = {};

  if (searchQuery && searchableFields.length > 0) {
    searchFilter.OR = searchableFields.map((field) => ({
      [field]: {
        contains: searchQuery,
        mode: Prisma.QueryMode.insensitive,
      },
    }));
  }

  searchFilter = {
    ...searchFilter,
    ...(Array.isArray(additionalFilter)
      ? Object.assign({}, ...additionalFilter)
      : additionalFilter),
  };

  const queryOptions: Record<string, any> = {
    where: searchFilter,
    skip,
    take: limit,
    orderBy: { [orderField]: orderPositiion },
  };

  if (selectFields?.select) queryOptions.select = selectFields.select;
  if (selectFields?.include) queryOptions.include = selectFields.include;

  const data = await model.findMany(queryOptions);

  const total = await model.count({ where: searchFilter });

  return {
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    data,
  };
};

export default searchAndPaginate;
