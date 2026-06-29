import { prisma } from '../Config/DB.js';
import {SourcingType} from "../generated/prisma/client.js"}
interface MarketProductInput{
    sku:string
    name:string
    category:string
    sourcingType:SourcingType
}