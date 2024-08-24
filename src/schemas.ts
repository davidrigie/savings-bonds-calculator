import { z } from 'zod'
import parseDate from 'date-fns/parse'

const numericStringSchema = z.union([
    z.number().int().positive(),
    z.string().nonempty()]).pipe(z.coerce.number().int().positive(),
)

const mmYYYYToDate = z.string().transform(s => parseDate(s, 'MM/yyyy', new Date()))

const dollarAmount = z.string().startsWith('$').transform(
    s => parseFloat(s.replace(',','').substring(1))
)

const interestRate = z.string()
                      .transform(s => parseFloat(s.substring(0, s.length - 1)) / 100 );

export const cliArgsSchema =
    z.array(z.string())
        .refine(([_, __, inputCsvFilePath, ____]) => 
            typeof inputCsvFilePath === 'string',
            { message: 'inputCsvFilePath is required' }
        )
        .refine(([_, __, ___, asOfDate]) => 
            !asOfDate || /\d\d\/\d\d\d\d/.test(asOfDate),
            { message: 'asOfDate should be in MM/YYYY format' }
        )
        .transform(([_, __, inputCsvFilePath, asOfDate]) =>
            ({
                inputCsvFilePath,
                asOfDate: asOfDate ? parseDate(asOfDate, 'MM/yyyy', new Date()) : undefined
            })
        )

export const bondSchema = 
    z.tuple([
        /** Series */
        z.literal('EE'),

        /** Denomination (USD) */
        numericStringSchema,

        /** Serial Number */
        z.string().nonempty(),

        /** Issue Date */
        mmYYYYToDate,
    ]).transform(
        ([series, denomination, serialNumber, issueDate]) =>
            ({ series, denomination, serialNumber, issueDate })
    )
export type Bond = z.infer<typeof bondSchema>

export const bondsCsvSchema = z.array(bondSchema)
export type BondsCsv = z.infer<typeof bondsCsvSchema>

export const bondValueTableRowSchema =
    z.tuple([
        /** Serial # */
        z.string().nonempty(),

        /** Series */
        z.string(),

        /** Denomination */
        dollarAmount,

        /** Issue Date */
        mmYYYYToDate,

        /** Next Accrual */
        mmYYYYToDate,

        /** Final Maturity */
        mmYYYYToDate,

        /** Issue Price */
        dollarAmount,

        /** Interest */
        dollarAmount,

        /** Interest Rate */
        interestRate,

        /** Value */
        dollarAmount,

        /** Note */
        z.string().optional(),

        /** Remove button, no text content */
        z.unknown(),
    ]).transform(
        ([serialNumber, series, denomination, issueDate, nextAccrual, finalMaturity, issuePrice, interest, interestRate, value, note]) =>
            ({ serialNumber, series, denomination, issueDate, nextAccrual, finalMaturity, issuePrice, interest, interestRate, value, note })
    )
export type BondValue = z.infer<typeof bondValueTableRowSchema>
