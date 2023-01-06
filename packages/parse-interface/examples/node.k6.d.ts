enum MyEnum {
  /**
   * @name 我是A
   */
  string = '名称',
  b = 1,
  c = 'zz',
}

export default interface IExample {
  /**
   * @name 用户 
   */
   a: string,
    /**
    * @name 活动id
    */ 
  b: boolean,
  c: number;
  d: {
      d1: number;
  },
  e: {
      e1: boolean;
  }[];
  f: Array<{
      f1: number;
  }>;
  g: MyArr;
  h: string[];
  i: 'a' | 'b',
}