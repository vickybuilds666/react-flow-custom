import { useCallback, useRef, useState } from 'react'
import ReactFlow, {
  addEdge, Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  Handle, Position, MarkerType,
  getBezierPath, EdgeLabelRenderer, BaseEdge,
  BackgroundVariant
} from 'reactflow'
import 'reactflow/dist/style.css'

const CFG = {
  trigger:   { icon:'⚡', color:'#ff6b35', badge:'ENTRY'   },
  transform: { icon:'⚙️', color:'#39d0ff', badge:'PROCESS' },
  condition: { icon:'◆',  color:'#f7c948', badge:'BRANCH'  },
  output:    { icon:'▣',  color:'#3cff8f', badge:'SINK'    },
  delay:     { icon:'◷',  color:'#c678ff', badge:'WAIT'    },
}

function Node({ data, selected }) {
  const c = CFG[data.type] || CFG.transform
  return (
    <div style={{minWidth:150,background:'#0c1018',border:`2px solid ${c.color}`,borderRadius:8,overflow:'hidden',boxShadow:selected?`0 0 20px ${c.color}`:'none'}}>
      <div style={{height:3,background:c.color}}/>
      <div style={{padding:'8px 10px',display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:16}}>{c.icon}</span>
        <span style={{fontSize:10,color:c.color,fontFamily:'monospace',letterSpacing:2}}>{data.type?.toUpperCase()}</span>
      </div>
      <div style={{padding:'0 10px 8px',color:'#dde8f0',fontWeight:700,fontSize:13}}>{data.label}</div>
      <div style={{padding:'5px 10px 8px',borderTop:'1px solid #131d2a'}}>
        <span style={{background:`${c.color}22`,color:c.color,padding:'2px 6px',borderRadius:3,fontSize:10,fontFamily:'monospace'}}>{c.badge}</span>
      </div>
      {data.type !== 'trigger' && <Handle type="target" position={Position.Left}/>}
      {data.type !== 'output'  && <Handle type="source" position={Position.Right}/>}
      {data.type === 'condition' && <Handle type="source" position={Position.Bottom} id="false"/>}
    </div>
  )
}

const nodeTypes = { custom: Node }

function Edge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected, markerEnd, data }) {
  const [path, lx, ly] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={{stroke:selected?'#39d0ff':'#1e3a55',strokeWidth:selected?2.5:1.5}}/>
      {selected && (
        <EdgeLabelRenderer>
          <div style={{position:'absolute',transform:`translate(-50%,-50%) translate(${lx}px,${ly}px)`,pointerEvents:'all'}}>
            <button onClick={()=>data?.del(id)} style={{background:'#0c1018',border:'1px solid #ff4757',color:'#ff4757',borderRadius:'50%',width:18,height:18,cursor:'pointer',fontSize:10}}>✕</button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

const edgeTypes = { custom: Edge }

const initNodes = [
  {id:'1',type:'custom',position:{x:60,y:150},data:{label:'HTTP Webhook',type:'trigger'}},
  {id:'2',type:'custom',position:{x:280,y:80},data:{label:'Parse JSON',type:'transform'}},
  {id:'3',type:'custom',position:{x:280,y:250},data:{label:'Validate',type:'condition'}},
  {id:'4',type:'custom',position:{x:500,y:80},data:{label:'Enrich Data',type:'transform'}},
  {id:'5',type:'custom',position:{x:500,y:300},data:{label:'Log Error',type:'output'}},
  {id:'6',type:'custom',position:{x:720,y:80},data:{label:'Send Response',type:'output'}},
]

const initEdges = [
  {id:'e1',source:'1',target:'2',type:'custom',markerEnd:{type:MarkerType.ArrowClosed,color:'#1e3a55'},data:{}},
  {id:'e2',source:'1',target:'3',type:'custom',markerEnd:{type:MarkerType.ArrowClosed,color:'#1e3a55'},data:{}},
  {id:'e3',source:'3',target:'4',type:'custom',markerEnd:{type:MarkerType.ArrowClosed,color:'#1e3a55'},data:{}},
  {id:'e4',source:'3',target:'5',type:'custom',sourceHandle:'false',markerEnd:{type:MarkerType.ArrowClosed,color:'#1e3a55'},data:{}},
  {id:'e5',source:'4',target:'6',type:'custom',markerEnd:{type:MarkerType.ArrowClosed,color:'#1e3a55'},data:{}},
]

let nid = 10

export default function App() {
  const wrap = useRef(null)
  const [rfi, setRfi] = useState(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges)

  const delEdge = useCallback(id => setEdges(es => es.filter(e => e.id !== id)), [setEdges])
  const edgesD = edges.map(e => ({...e, data:{...e.data, del:delEdge}}))

  const onConnect = useCallback(p => setEdges(es => addEdge({...p,type:'custom',markerEnd:{type:MarkerType.ArrowClosed,color:'#1e3a55'},data:{del:delEdge}},es)), [setEdges,delEdge])

  const onDrop = useCallback(e => {
    e.preventDefault()
    const t = e.dataTransfer.getData('type')
    if (!t || !rfi) return
    const b = wrap.current.getBoundingClientRect()
    const pos = rfi.screenToFlowPosition({x:e.clientX-b.left,y:e.clientY-b.top})
    setNodes(ns => ns.concat({id:`n${++nid}`,type:'custom',position:pos,data:{label:t+' Node',type:t}}))
  }, [rfi, setNodes])

  const sidebar = Object.entries(CFG)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'#07090d',color:'#fff',fontFamily:'sans-serif'}}>
      <div style={{height:50,background:'#0c1018',borderBottom:'1px solid #1e2d42',display:'flex',alignItems:'center',padding:'0 16px',gap:12}}>
        <span style={{color:'#39d0ff',fontFamily:'monospace',letterSpacing:3,fontSize:14}}>FLOW<span style={{color:'#ff4757'}}>.</span>CRAFT</span>
        <span style={{color:'#4a6580',fontSize:11}}>{nodes.length} nodes · {edges.length} edges</span>
        <div style={{flex:1}}/>
        <button onClick={()=>{setNodes([]);setEdges([])}} style={{background:'transparent',border:'1px solid #ff475733',color:'#ff4757',padding:'4px 12px',borderRadius:4,cursor:'pointer',fontSize:11}}>CLEAR</button>
      </div>
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        <div style={{width:150,background:'#0c1018',borderRight:'1px solid #1e2d42'}}>
          <div style={{padding:'8px 12px',fontSize:9,letterSpacing:2,color:'#4a6580',borderBottom:'1px solid #1e2d42'}}>DRAG → CANVAS</div>
          {sidebar.map(([type,c]) => (
            <div key={type} draggable onDragStart={e=>{e.dataTransfer.setData('type',type)}}
              style={{padding:'10px 12px',display:'flex',alignItems:'center',gap:8,cursor:'grab',borderBottom:'1px solid #0e1822'}}>
              <span style={{background:`${c.color}22`,color:c.color,width:26,height:26,borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>{c.icon}</span>
              <span style={{fontSize:12,fontWeight:600,color:'#c0cfe0',textTransform:'capitalize'}}>{type}</span>
            </div>
          ))}
        </div>
        <div style={{flex:1}} ref={wrap}>
          <ReactFlow
            nodes={nodes} edges={edgesD}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onInit={setRfi}
            onDrop={onDrop} onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect='move'}}
            nodeTypes={nodeTypes} edgeTypes={edgeTypes}
            fitView deleteKeyCode="Delete"
            style={{background:'#07090d'}}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1a2840"/>
            <Controls/>
            <MiniMap nodeColor={n=>CFG[n.data?.type]?.color||'#39d0ff'} nodeStrokeWidth={3}/>
          </ReactFlow>
        </div>
      </div>
    </div>
  )
              }
