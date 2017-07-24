import eventEmitter from 'eventemitter3'

const DEFAULT_EDGE_NAME = '\x00'
const GRAPH_NODE = '\x00'
const EDGE_KEY_DELIM = '\x01'

const Events = {
  SET_NODE: 'setNode',
  REMOVE_NODE: 'removeNode',
  SET_EDGE: 'setEdge',
  REMOVE_EDGE: 'removeEdge'
}

// node
export type N = string
// edge hash (it's always an string)
export type E = string

export interface GraphOptions {
  directed?: boolean
  multigraph?: boolean
  compound?: boolean
}

export interface Edge {
  v: N
  w: N
  name?: string
}

export default class Graph extends eventEmitter.EventEmitter {
  /**
   * True if the graph is directed, see http://mathworld.wolfram.com/DirectedGraph.html
   * @default true
   */
  private _isDirected: boolean

  /**
   * True if the graph is a multigraph, see http://mathworld.wolfram.com/Multigraph.html
   * @default false
   */
  private _isMultigraph: boolean

  /**
   * True if the graph is compound e.g. when there are parent-child
   * relationship between nodes
   * @default false
   */
  private _isCompound: boolean

  private _nodes: Map<N, any>
  private _edges: Map<E, any>

  private _parent: Map<N, N>
  private _children: Map<N, Set<N>>

  private _inEdges: Map<N, Map<E, Edge>>
  private _outEdges: Map<N, Map<E, Edge>>

  private _predecessors: Map<N, Map<N, number>>
  private _successors: Map<N, Map<N, number>>

  private _edgeObjs: Map<E, Edge>
  private _listeners: Map<string, Set<(...args: Array<any>) => void>>

  /**
   * @param opts `GraphOptions`
   *    opts.directed boolean
   *    opts.multigraph boolean
   *    opts.compound boolean
   */
  constructor(opts: GraphOptions = {}) {
    super()
    this._isDirected = opts.hasOwnProperty('directed')
      ? Boolean(opts.directed)
      : true
    this._isMultigraph = opts.hasOwnProperty('multigraph')
      ? Boolean(opts.multigraph)
      : false
    this._isCompound = opts.hasOwnProperty('compound')
      ? Boolean(opts.compound)
      : false

    this._nodes = new Map<N, any>()
    this._edges = new Map<E, any>()

    if (this._isCompound) {
      this._parent = new Map<N, N>()
      this._children = new Map<N, Set<N>>()
      this._children.set(GRAPH_NODE, new Set<N>())
    }

    this._inEdges = new Map<N, Map<string, Edge>>()
    this._outEdges = new Map<N, Map<string, Edge>>()

    this._predecessors = new Map<N, Map<N, number>>()
    this._successors = new Map<N, Map<N, number>>()

    this._edgeObjs = new Map<E, Edge>()

    this._listeners = new Map<string, Set<(...args: Array<any>) => void>>()
  }

  /**
   * 
   */
  isDirected(): boolean {
    return this._isDirected
  }

  isMultigraph(): boolean {
    return this._isMultigraph
  }

  isCompound(): boolean {
    return this._isCompound
  }

  // nodes
  nodeCount(): number {
    return this._nodes.size
  }

  nodes(): IterableIterator<N> {
    return this._nodes.keys()
  }

  *sources(): IterableIterator<N> {
    for (let node of this.nodes()) {
      if ((this._inEdges.get(node) as Map<N, Edge>).size === 0) {
        yield node
      }
    }
  }

  *sinks(): IterableIterator<N> {
    for (let node of this.nodes()) {
      if ((this._outEdges.get(node) as Map<N, Edge>).size === 0) {
        yield node
      }
    }
  }

  setNode(node: N, value?: any): Graph {
    if (this._nodes.has(node)) {
      this._nodes.set(node, value)
      this.emit(Events.SET_NODE, node, value, true)
      return this
    }

    this._nodes.set(node, value)

    if (this._isCompound) {
      this._parent.set(node, GRAPH_NODE)
      this._children.set(node, new Set<N>())
      const childSet = this._children.get(GRAPH_NODE)
      if (childSet) {
        childSet.add(node)
      }
    }
    this._inEdges.set(node, new Map<string, Edge>())
    this._outEdges.set(node, new Map<string, Edge>())
    this._predecessors.set(node, new Map<N, number>())
    this._successors.set(node, new Map<N, number>())
    this.emit(Events.SET_NODE, node, value)
    return this
  }

  node(node: N): any {
    return this._nodes.get(node)
  }

  hasNode(node: N): boolean {
    return this._nodes.has(node)
  }

  removeNode(node: N): void {
    if (!this.hasNode(node)) {
      return
    }

    this._nodes.delete(node)
    if (this.isCompound()) {
      this.removeFromParentsChildList(node)
      this._parent.delete(node)
      for (let child of this.nodes()) {
        this.setParent(child)
      }
      this._children.delete(node)
    }

    const inEdges = this._inEdges.get(node)
    if (inEdges) {
      for (let edge of inEdges.values()) {
        this.removeEdge(edge)
      }
    }
    this._inEdges.delete(node)

    const outEdges = this._outEdges.get(node)
    if (outEdges) {
      for (let edge of outEdges.values()) {
        this.removeEdge(edge)
      }
    }
    this._outEdges.delete(node)

    this._successors.delete(node)
    this._predecessors.delete(node)
    this.emit(Events.REMOVE_NODE, node)
  }

  setParent(node: N, parent?: N): Graph {
    if (!this.isCompound()) {
      throw new Error('Cannot set parent in a non-compound graph')
    }

    if (!parent) {
      parent = GRAPH_NODE
    } else {
      for (
        let ancestor: N | undefined = parent;
        ancestor;
        ancestor = this.parent(ancestor)
      ) {
        if (ancestor === node) {
          throw new Error(
            `Setting ${parent} as parent of ${node} would create a cycle`
          )
        }
      }
      this.setNode(parent)
    }

    this.setNode(node)
    this.removeFromParentsChildList(node)
    this._parent.set(node, parent)
    const childrenSet = this._children.get(parent)
    if (childrenSet) {
      childrenSet.add(node)
    }
    return this
  }

  parent(node: N): N | undefined {
    if (this.isCompound()) {
      const parent = this._parent.get(node)
      if (parent !== GRAPH_NODE) {
        return parent
      }
    }
  }

  *children(node: N = GRAPH_NODE): IterableIterator<N> {
    if (this.isCompound()) {
      const children = this._children.get(node)
      if (children) {
        for (let child of children.values()) {
          yield child
        }
      }
    } else if (node === GRAPH_NODE) {
      return this.nodes()
    }
  }

  *predecessors(node: N): IterableIterator<N> {
    if (!this.hasNode(node)) {
      return
    }
    const predecessors = this._predecessors.get(node)
    if (predecessors) {
      for (const key of predecessors.keys()) {
        yield key
      }
    }
  }

  *successors(node: N): IterableIterator<N> {
    if (!this.hasNode(node)) {
      return
    }
    const successors = this._successors.get(node)
    if (successors) {
      for (const key of successors.keys()) {
        yield key
      }
    }
  }

  *neighbors(node: N): IterableIterator<N> {
    const predecessors = this._predecessors.get(node)
    if (predecessors) {
      for (let key of predecessors.keys()) {
        yield key
      }
    }

    const successors = this._successors.get(node)

    if (successors) {
      for (let key of successors.keys()) {
        if (!predecessors || !predecessors.has(key)) {
          yield key
        }
      }
    }
  }

  isLeaf(node: N): boolean {
    if (this.isDirected()) {
      return Array.from(this.successors(node)).length === 0
    }
    return Array.from(this.neighbors(node)).length === 0
  }

  // edge functions

  edgeCount(): number {
    return this._edges.size
  }

  edges(): IterableIterator<Edge> {
    return this._edgeObjs.values()
  }

  setPath(path: Array<N>, value?: any): Graph {
    path.reduce((prev, cur) => {
      if (typeof value !== 'undefined') {
        this.setEdge(prev, cur, value)
      } else {
        this.setEdge(prev, cur)
      }
      return cur
    })
    return this
  }

  setEdge(...args: Array<any>): Graph {
    let v: N
    let w: N
    let name: any
    let value: any
    let valueSpecified = false
    const arg0: Edge = args[0]
    if (arg0 !== null && typeof arg0 === 'object' && 'v' in arg0) {
      v = arg0.v
      w = arg0.w
      name = arg0.name
      if (args.length === 2) {
        value = args[1]
        valueSpecified = true
      }
    } else {
      v = args[0]
      w = args[1]
      name = args[3]
      if (args.length > 2) {
        value = args[2]
        valueSpecified = true
      }
    }

    const e = edgeArgsToId(this.isDirected(), v, w, name)
    const edgeObj = edgeArgsToObj(this.isDirected(), v, w, name)

    if (this._edgeObjs.has(e)) {
      if (valueSpecified) {
        this._edges.set(e, value)
        this.emit(Events.SET_EDGE, edgeObj, value, true)
      }
      return this
    }

    if (typeof name !== 'undefined' && !this.isMultigraph()) {
      throw new Error('cannot set a named edge when multigraph = false')
    }

    this.setNode(v)
    this.setNode(w)

    this._edges.set(e, value)

    v = edgeObj.v
    w = edgeObj.w
    Object.freeze(edgeObj)
    this._edgeObjs.set(e, edgeObj)

    incrementOrInitEntry(this._predecessors.get(w) as Map<N, number>, v)
    incrementOrInitEntry(this._successors.get(v) as Map<N, number>, w)
    ;(this._inEdges.get(w) as Map<E, Edge>).set(e, edgeObj)
    ;(this._outEdges.get(v) as Map<E, Edge>).set(e, edgeObj)

    this.emit(Events.SET_EDGE, edgeObj, value)
    return this
  }

  edge(...args: Array<any>): E {
    const [v, w, name] = args
    const e =
      args.length === 1
        ? edgeObjToId(this.isDirected(), args[0] as Edge)
        : edgeArgsToId(this.isDirected(), v, w, name)
    return this._edges.get(e)
  }

  hasEdge(...args: Array<any>): boolean {
    const [v, w, name] = args
    const e =
      args.length === 1
        ? edgeObjToId(this.isDirected(), args[0] as Edge)
        : edgeArgsToId(this.isDirected(), v, w, name)
    return this._edges.has(e)
  }

  removeEdge(...args: Array<any>): Graph {
    let [v, w, name] = args
    const e =
      args.length === 1
        ? edgeObjToId(this.isDirected(), args[0] as Edge)
        : edgeArgsToId(this.isDirected(), v, w, name)
    const edge = this._edgeObjs.get(e)
    if (edge) {
      v = edge.v
      w = edge.w
      this._edges.delete(e)
      this._edgeObjs.delete(e)
      decrementOrRemoveEntry(this._predecessors.get(w) as Map<N, number>, v)
      decrementOrRemoveEntry(this._successors.get(v) as Map<N, number>, w)
      ;(this._inEdges.get(w) as Map<E, Edge>).delete(e)
      ;(this._outEdges.get(v) as Map<E, Edge>).delete(e)
      this.emit(Events.REMOVE_EDGE, edge)
    }
    return this
  }

  *inEdges(v: N, u?: N): IterableIterator<Edge> {
    const inV: Map<E, Edge> = this._inEdges.get(v) as Map<E, Edge>
    if (inV) {
      const edges: IterableIterator<Edge> = inV.values()
      for (let edge of edges) {
        if (!u) {
          yield edge
        } else if (edge.v === u) {
          yield edge
        }
      }
    }
  }

  *outEdges(v: N, w?: N): IterableIterator<Edge> {
    const outV: Map<E, Edge> = this._outEdges.get(v) as Map<E, Edge>
    if (outV) {
      const edges: IterableIterator<Edge> = outV.values()
      for (let edge of edges) {
        if (!w) {
          yield edge
        }
        if (edge.w === w) {
          yield edge
        }
      }
    }
  }

  *nodeEdges(v: N, w: N): IterableIterator<Edge> {
    for (let edge of this.inEdges(v, w)) {
      yield edge
    }
    for (let edge of this.outEdges(v, w)) {
      yield edge
    }
  }

  private removeFromParentsChildList(node: N): void {
    const parent: N = this._parent.get(node) as N
    const parentChildList = this._children.get(parent)
    if (parentChildList) {
      parentChildList.delete(node)
    }
  }
}

function incrementOrInitEntry(map: Map<N, number>, k: N): void {
  map.set(k, (map.get(k) || 0) + 1)
}

function decrementOrRemoveEntry(map: Map<N, number>, k: N): void {
  if (map.has(k)) {
    const newValue: number = (map.get(k) as number) - 1
    if (newValue > 0) {
      map.set(k, newValue)
    } else {
      map.delete(k)
    }
  }
}

function edgeArgsToId(isDirected: boolean, v: N, w: N, name?: string): string {
  if (!isDirected && v > w) {
    let tmp = v
    v = w
    w = tmp
  }
  return v + EDGE_KEY_DELIM + w + EDGE_KEY_DELIM + name
}

function edgeArgsToObj(isDirected: boolean, v: N, w: N, name?: string): Edge {
  if (!isDirected && v > w) {
    let tmp = v
    v = w
    w = tmp
  }
  const edgeObj: Edge = { v, w }
  if (name) {
    edgeObj.name = name
  }
  return edgeObj
}

function edgeObjToId(isDirected: boolean, edgeObj: Edge): string {
  return edgeArgsToId(isDirected, edgeObj.v, edgeObj.w, edgeObj.name)
}
