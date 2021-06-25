               interface Person {
                 name: string;
                 surname?: string;
                 age: number;
                 premium: boolean;
                 items: {id: string; name: string}[];
                 city: {
                   name: string;
                   address: string;
                 };
               }
               
               interface Student extends Person {
                 grade: number;
                 pass: boolean;
                 teacher: string;
               }
