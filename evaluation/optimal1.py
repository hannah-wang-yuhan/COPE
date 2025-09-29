import json
import pandas as pd

# ----------------------------
# 读取多个数据文件
# ----------------------------
import glob
import os

json_files = glob.glob("C:/Users/Administrator/Desktop/cope/COPE/evaluation/data/*.json")
print(f"找到 {len(json_files)} 个JSON文件: {json_files}")

all_session_metrics = []
for file_path in json_files:
    print(f"正在处理文件: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        session_data = json.load(f)
    query_keys = [k for k in session_data.keys() if k not in ["scroll", "overallButton"]]
    
    # ----------------------------
    # 初始化指标列表
    # ----------------------------
    engagements = 0
    dsat_engagement = 0
    first_engage_time = None
    last_engage_time = None
    session_depth = 0
    user_text_lengths = []
    system_text_lengths = []
    query_order_rr = []  
    last_dsat_engagement_query_order = 0  
    navigate_dwell_times = []  
    navigate_count = 0  
    
    # 遍历每个 Query 阶段
    current_msg_index = 0
    session_depth = len(query_keys) // 2
    for key in query_keys:
        queries = session_data.get(key, [])
        for q in queries:
            current_msg_index += 1
            current_query_index = (current_msg_index + 1) // 2
            for msg_id, msg in q.items():
                # 文本长度
                if msg["role"] == "user":
                    user_text_lengths.append(len(msg["text"]))
                else:
                    system_text_lengths.append(len(msg["text"]))
                
                # Engagement 判定和计数
                # 基础engagement (click 或 hover)
                base_engage = (msg.get("count_num",0) > 0) or (msg.get("hover_count",0) > 0)
                
                # copy_details中的每个条目算一次engagement
                copy_engagements = len(msg.get("copy_details", []))
                
                # buttons中的每个条目算一次engagement  
                button_engagements = len(msg.get("buttons", []))
                
                # 总engagement次数
                total_engagements = (1 if base_engage else 0) + copy_engagements + button_engagements
                
                if total_engagements > 0:
                    engagements += total_engagements
                    t = pd.to_datetime(msg["time_stamp"])
                    if first_engage_time is None:
                        first_engage_time = t
                    last_engage_time = t
                    
                    # 计算查询位置倒数 (1/query_position) - 每个engagement都添加
                    for _ in range(total_engagements):
                        query_order_rr.append(1.0 / current_query_index)

                    # 不满意 Engagement 判定 (只考虑基础engagement)
                    if base_engage:
                        hover_count = msg.get("hover_count",0)
                        hover_duration = msg.get("hover_duration_ms",0)
                        avg_hover = hover_duration / hover_count if hover_count>0 else 0
                        # 检查是否有不满意的按钮点击
                        buttons = msg.get("buttons", [])
                        has_bad_response = any(button.get("name", "").lower() == "bad response" for button in buttons)
                        has_regenerate = any(button.get("name", "").lower() == "regenerate" for button in buttons)
                        
                        if avg_hover < 30000 or has_bad_response or has_regenerate:
                            dsat_engagement += 1
                            last_dsat_engagement_query_order = current_query_index
                
                # 处理导航停留时间和计数
                navigate_details = msg.get("navigate_details", [])
                navigate_count += len(navigate_details)  # 统计导航行为总数
                for nav in navigate_details:
                    if nav.get("start_timestamp") and nav.get("return_timestamp"):
                        start_time = pd.to_datetime(nav["start_timestamp"])
                        return_time = pd.to_datetime(nav["return_timestamp"])
                        dwell_time = (return_time - start_time).total_seconds()
                        navigate_dwell_times.append(dwell_time)
    
    # ----------------------------
    # 滚动指标
    # ----------------------------
    scrolls = session_data.get("scroll", [])
    max_scroll_distance = max([abs(s.get("distance",0)) for s in scrolls], default=0)
    
    # 回滚计数
    scroll_back_count = sum(1 for i in range(1,len(scrolls)) 
                            if scrolls[i]["direction"] != scrolls[i-1]["direction"] and scrolls[i]["direction"]!="none")
    
    # 来回滚动次数占比（MixedScrollRatio）
    mixed_scroll_count = sum(1 for i in range(1,len(scrolls)) 
                            if scrolls[i]["direction"] != scrolls[i-1]["direction"] and scrolls[i]["direction"] in ["up","down"])
    mixed_scroll_ratio = mixed_scroll_count / len(scrolls) if scrolls else 0
    
    # 滚动波动性（ScrollVolatility）
    direction_change_count = sum(1 for i in range(1, len(scrolls)) 
                               if scrolls[i]["direction"] != scrolls[i-1]["direction"])
    scroll_volatility = direction_change_count / (len(scrolls) - 1) if len(scrolls) > 1 else 0
    
    # 平均暂停时间（AvgPauseTime）
    pause_times = []
    for i in range(1, len(scrolls)):
        prev_end_time = pd.to_datetime(scrolls[i-1]["endTime"])
        curr_start_time = pd.to_datetime(scrolls[i]["startTime"])
        pause_time = (curr_start_time - prev_end_time).total_seconds()
        pause_times.append(pause_time)
    avg_pause_time = sum(pause_times) / len(pause_times) if pause_times else 0
    
    # 总滚动时间 / 平均滚动时间
    total_scroll_time = sum([(pd.to_datetime(s["endTime"]) - pd.to_datetime(s["startTime"])).total_seconds()
                             for s in scrolls])
    ave_scroll_time = total_scroll_time / len(scrolls) if scrolls else 0
    
    # 是否有滚动回到顶部
    scroll_top_rate = 1 if any(s.get("edge","")=="top" for s in scrolls) else 0
    
    # ----------------------------
    # 计算指标
    # ----------------------------
    session_metric = {
        "id": os.path.basename(file_path).replace('.json', ''),  # 添加id列，等于JSON文件名
        "SessionDwellTime": 0,
        "UniqueEngagementRate": 1 if engagements>0 else 0,
        "SessionEngagementRate": engagements,
        "QueryEngagementRate": engagements/session_depth if session_depth>0 else 0,
        "SessionDepth": session_depth,
        "TimeToFirstEngagement": (first_engage_time - pd.to_datetime(scrolls[0]["startTime"])).total_seconds() if first_engage_time and scrolls else None,
        "TimeToLastEngagement": (last_engage_time - pd.to_datetime(scrolls[0]["startTime"])).total_seconds() if last_engage_time and scrolls else None,
        "DsatEngagementCount": dsat_engagement,
        "DsatEngagementRatio": dsat_engagement/engagements if engagements>0 else 0,
        "AveUserTextLength": sum(user_text_lengths)/len(user_text_lengths) if user_text_lengths else 0,
        "AveSystemTextLength": sum(system_text_lengths)/len(system_text_lengths) if system_text_lengths else 0,
        "MaxScrollDistance": max_scroll_distance,
        "MaxScrollQueryDepth": 0,
        "MaxScrollDistance_rel": max_scroll_distance * session_depth,
        "MaxScrollQueryDepth_rel": 0 * session_depth,
        "ScrollBackCount": scroll_back_count,
        "ScrollBackCount_rel": scroll_back_count * session_depth,
        "ScrollBackQueryDepth": 0,
        "ScrollBackQueryDepth_rel": 0 * session_depth,
        "MixedScrollCount": mixed_scroll_count,
        "MixedScrollCount_rel": mixed_scroll_count * session_depth,
        "MixedScrollRatio": mixed_scroll_ratio,
        "MixedScrollRatio_rel": mixed_scroll_ratio * session_depth,
        "SumScrollTime": total_scroll_time,
        "AveScrollTime": ave_scroll_time,
        "ScrollTopRate": scroll_top_rate,
        "MinQueryOrderRR": min(query_order_rr) if query_order_rr else 0,
        "MaxQueryOrderRR": max(query_order_rr) if query_order_rr else 0,
        "MeanQueryOrderRR": sum(query_order_rr) / len(query_order_rr) if query_order_rr else 0,
        "ScrollVolatility": scroll_volatility,
        "AvgPauseTime": avg_pause_time,
        "LastDsatEngagementQueryOrder": last_dsat_engagement_query_order,
        "LastDsatEngagementQueryOrder_rel": last_dsat_engagement_query_order * session_depth,
        "NavigateCount": navigate_count,
        "SumNavigateDwell": sum(navigate_dwell_times),
        "AveNavigateDwell": sum(navigate_dwell_times) / len(navigate_dwell_times) if navigate_dwell_times else 0,
        "PLE_abs": engagements * max(query_order_rr) if query_order_rr else 0,
        "PLE_rel": engagements * max(query_order_rr) * session_depth if query_order_rr else 0
    }
    
    all_session_metrics.append(session_metric)


df = pd.DataFrame(all_session_metrics)
df.to_csv("C:/Users/Administrator/Desktop/cope/COPE/evaluation/results/optimal1_result.csv", index=False)
print(f"指标计算完成，共处理 {len(all_session_metrics)} 个会话，已保存到 optimal1_result.csv")

