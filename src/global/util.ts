import * as moment from 'moment-timezone';

export const toDateString = (date: Date): string => {
    return moment(date).format('YY-MM-DD hh:mm:ss')
}