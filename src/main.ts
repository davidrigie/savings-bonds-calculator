import { readFile, writeFile } from 'fs/promises'
import { parse as parseCsv } from 'csv-parse/sync'

import { bondsCsvSchema, cliArgsSchema } from './schemas'
import { calculateBondValues } from './treasury-direct-calculator'
import { format } from 'date-fns'

function arrayToCSV<T extends Record<string, any>>(array: T[]): string {
    if (array.length === 0) {
        return '';
    }

    const headers = Object.keys(array[0]);
    const csvRows: string[] = [];

    // Add the headers row
    csvRows.push(headers.join(','));

    // Loop through the rows
    for (const row of array) {
        const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(values.join(','));
    }

    // Join the rows with newlines
    return csvRows.join('\n');
}


export const main = async (): Promise<void> => {
    try {
        const { inputCsvFilePath, asOfDate } = cliArgsSchema.parse(process.argv)

        console.log(`Reading ${inputCsvFilePath}...`)

        const bondsCsv = await readFile(inputCsvFilePath)
        const bonds = bondsCsvSchema.parse(parseCsv(bondsCsv))

        console.log(`Calculating value of ${bonds.length} bonds${asOfDate ? `as of ${asOfDate?.toLocaleTimeString()}` : ''}...`)

        const { valuesAsOfDate, bondValues } = await calculateBondValues(bonds, asOfDate)
        console.table(bondValues);
        const csvTable = arrayToCSV(bondValues);
        const outputCsvFilePath = inputCsvFilePath.replace('.csv', '-processed.csv')
        await writeFile(outputCsvFilePath, csvTable);
        console.log(`Wrote ${outputCsvFilePath}`);
    
    } catch (e) {
        console.error(`Error: ${(e as Error).message}`)
        console.log('Usage: ./savings-bonds-calculator [csv file] [as of date (optional)]')
    }
}
